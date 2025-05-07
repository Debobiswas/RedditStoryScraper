import os
import re
import pandas as pd
import praw
from dotenv import load_dotenv
import argparse
from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT

# Initialize Reddit client
reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_CLIENT_SECRET,
    user_agent=REDDIT_USER_AGENT
)

# List of swear words to censor
SWEAR_WORDS = [
    "fuck", "shit", "bitch", "cunt", "asshole", "bastard", "dick", "fucker",
    "nigga", "nigger", "slut", "whore", "fucking", "fucked", "dumbass",

      "asshole", "bastard", "dick", "pussy",
    "cunt", "motherfucker", "faggot"
]

def clean_text(text):
    """Clean and flatten text: remove markdown formatting, line breaks, extra spaces, and filter swear words."""
    text = re.sub(r'\*{1,2}(.*?)\*{1,2}', r'\1', text)
    text = re.sub(r'~~(.*?)~~', r'\1', text)
    text = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', text)
    text = ' '.join(text.strip().split())
    text = re.sub(r'(?<!\.)\.\.(?!\.)', '...', text)
    text = text.replace("...", "…")
    text = re.sub(r'([.,!?])([^\s])', r'\1 \2', text)

    # Replace swear words with ****
    for swear in SWEAR_WORDS:
        text = re.sub(rf'\b{re.escape(swear)}\b', '****', text, flags=re.IGNORECASE)

    return text

def split_text_for_formatting(text, max_length=250):
    """Split text into lines of max_length, breaking at commas or periods if possible."""
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        current_line.append(word)
        line = " ".join(current_line)
        if len(line) > max_length:
            joined = " ".join(current_line[:-1])
            split_pos = max(joined.rfind(','), joined.rfind('.'))

            if split_pos != -1 and split_pos < max_length:
                good_line = joined[:split_pos + 1].strip()
                lines.append(good_line)
                leftover = joined[split_pos + 1:].strip().split()
                current_line = leftover + [current_line[-1]]
            else:
                lines.append(" ".join(current_line[:-1]))
                current_line = [current_line[-1]]

    if current_line:
        lines.append(" ".join(current_line))
    return lines

def load_existing_stories(csv_file):
    if os.path.exists(csv_file):
        df = pd.read_csv(csv_file)
        return set(df['title'].values)
    else:
        return set()

def scrape_subreddit(subreddit_link, num_posts, csv_file):
    try:
        subreddit_name = subreddit_link.strip("/").split("/")[-1]
        print(f"Attempting to access subreddit: r/{subreddit_name}")
        
        subreddit = reddit.subreddit(subreddit_name)
        posts = []

        existing_titles = load_existing_stories(csv_file)
        
        print(f"\n🔍 Scraping {num_posts} post(s) from r/{subreddit_name}...\n")

        for post in subreddit.hot(limit=num_posts):
            if post.stickied or not post.selftext or post.selftext.lower() in ['[removed]', '[deleted]']:
                continue

            if post.title in existing_titles:
                print(f"⏭️ Skipping already scraped story: {post.title}")
                continue

            cleaned_body = clean_text(post.selftext)

            if len(cleaned_body) < 100:
                continue

            posts.append({
                "title": clean_text(post.title),
                "body": cleaned_body,
                "upvotes": post.score,
                "url": f"https://www.reddit.com{post.permalink}"
            })

        if not posts:
            print("⚠️ No valid stories found.")
            return None

        df = pd.DataFrame(posts)
        if os.path.exists(csv_file):
            df_existing = pd.read_csv(csv_file)
            df_combined = pd.concat([df_existing, df], ignore_index=True)
        else:
            df_combined = df

        df_combined.to_csv(csv_file, index=False)
        print(f"\n✅ Scraped {len(posts)} new stories and saved to '{csv_file}'.")

        with open("stories.txt", "a", encoding="utf-8") as f:
            for post in posts:
                f.write(post["title"] + "\n")
                formatted_lines = split_text_for_formatting(post["body"])
                for line in formatted_lines:
                    f.write(line + "\n")
                f.write("\n")
            print(f"📝 Also saved text version to 'stories.txt'")

        return csv_file
    except Exception as e:
        print(f"❌ Error during scraping: {str(e)}")
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reddit Story Scraper")
    parser.add_argument("subreddit_link", help="Subreddit URL (e.g. https://www.reddit.com/r/confession/)")
    parser.add_argument("num_posts", type=int, help="Number of posts to scrape")
    parser.add_argument("csv_file", help="The CSV file to save the stories")

    args = parser.parse_args()
    scrape_subreddit(args.subreddit_link, args.num_posts, args.csv_file)
