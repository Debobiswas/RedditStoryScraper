import praw
import pandas as pd
import os
from dotenv import load_dotenv
import argparse
import re

# Load Reddit API keys
load_dotenv()

reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT")
)

def clean_text(text):
    """Clean and flatten text: remove markdown formatting, line breaks, and extra spaces."""
    # Remove bold (**text**) and italics (*text*)
    text = re.sub(r'\*{1,2}(.*?)\*{1,2}', r'\1', text)

    # Remove strikethroughs (~~text~~)
    text = re.sub(r'~~(.*?)~~', r'\1', text)

    # Remove code formatting (`text`)
    text = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', text)

    # Flatten multiple spaces and newlines
    return ' '.join(text.strip().split())

def scrape_subreddit(subreddit_link, num_posts):
    subreddit_name = subreddit_link.strip("/").split("/")[-1]
    subreddit = reddit.subreddit(subreddit_name)
    posts = []

    print(f"\n🔍 Scraping {num_posts} post(s) from r/{subreddit_name}...\n")

    for post in subreddit.hot(limit=num_posts):
        # Skip stickied posts or posts with empty/removed text
        if post.stickied or not post.selftext or post.selftext.lower() in ['[removed]', '[deleted]']:
            continue

        cleaned_body = clean_text(post.selftext)

        # Optional: Skip very short stories (< 100 characters)
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

    # Save to CSV
    df = pd.DataFrame(posts)
    output_file = f"{subreddit_name}_stories.csv"
    df.to_csv(output_file, index=False)
    print(f"\n✅ Scraped {len(posts)} stories and saved to '{output_file}'.")
    
    # Optional: Save to .txt with spacing
    with open(f"{subreddit_name}_stories.txt", "w", encoding="utf-8") as f:
        for post in posts:
            f.write(post["title"] + "\n")
            f.write(post["body"] + "\n\n")  # <- one blank line between stories
        print(f"📝 Also saved text version to '{subreddit_name}_stories.txt'")


    return output_file

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reddit Story Scraper")
    parser.add_argument("subreddit_link", help="Subreddit URL (e.g. https://www.reddit.com/r/confession/)")
    parser.add_argument("num_posts", type=int, help="Number of posts to scrape")

    args = parser.parse_args()
    scrape_subreddit(args.subreddit_link, args.num_posts)
