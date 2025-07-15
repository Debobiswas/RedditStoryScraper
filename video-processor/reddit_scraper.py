"""
Reddit scraper that extracts posts and comments from Reddit URLs
"""

import praw
import re
import os
import json
import argparse
import sys
from typing import List, Dict
from urllib.parse import urlparse
from dotenv import load_dotenv
from pathlib import Path
from utils.logger import setup_logger

# Load environment variables from a .env file at the project root
dotenv_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

class RedditScraper:
    def __init__(self):
        self.logger = setup_logger('reddit_scraper')
        
        # Initialize Reddit API client
        self.reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent=os.getenv('REDDIT_USER_AGENT', 'RedditStoryGenerator/1.0')
        )
    
    def scrape_posts(self, reddit_url: str, num_posts: int = 5, sort_method: str = 'hot') -> List[Dict]:
        """
        Scrape Reddit posts from a given URL
        
        Args:
            reddit_url: Reddit URL (post or subreddit)
            num_posts: Number of posts to scrape
            sort_method: Sort method for subreddit posts ('hot', 'new', 'top')
            
        Returns:
            List of post dictionaries with text content
        """
        try:
            posts = []
            
            if '/comments/' in reddit_url:
                # Single post URL
                submission = self.reddit.submission(url=reddit_url)
                post = self._scrape_single_post(submission)
                if post:
                    posts.append(post)
            else:
                # Subreddit URL
                posts = self._scrape_subreddit_posts(reddit_url, num_posts, sort_method)
            
            return posts[:num_posts]
            
        except Exception as e:
            self.logger.error(f'Error scraping Reddit: {str(e)}')
            raise
    
    def _scrape_single_post(self, submission) -> Dict:
        """Scrape a single Reddit post"""
        try:
            # Get post content
            post_text = submission.selftext if submission.selftext else submission.title
            
            # Get top comments
            comments = []
            submission.comments.replace_more(limit=0)
            for comment in submission.comments[:5]:  # Top 5 comments
                if len(comment.body) > 20:  # Only meaningful comments
                    comments.append(comment.body)
            
            return {
                'id': submission.id,
                'title': submission.title,
                'text': post_text,
                'comments': comments,
                'score': submission.score,
                'created_utc': submission.created_utc,
                'url': submission.permalink,
                'subreddit': str(submission.subreddit)
            }
            
        except Exception as e:
            self.logger.error(f'Error scraping single post: {str(e)}')
            return None
    
    def _scrape_subreddit_posts(self, subreddit_url: str, num_posts: int, sort_method: str) -> List[Dict]:
        """Scrape posts from a subreddit"""
        try:
            # --- Robust subreddit name extraction ---
            match = re.search(r'/r/([^/]+)', subreddit_url)
            if not match:
                raise ValueError(f"Could not extract subreddit from URL: {subreddit_url}")
            subreddit_name = match.group(1)
            # ---
            
            self.logger.info(f"Scraping subreddit: {subreddit_name} (sorting by {sort_method})")
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = []
            
            # Get posts by specified sort method
            if sort_method == 'hot':
                submissions_generator = subreddit.hot()
            elif sort_method == 'new':
                submissions_generator = subreddit.new()
            elif sort_method == 'top':
                submissions_generator = subreddit.top(time_filter='day')
            elif sort_method == 'rising':
                submissions_generator = subreddit.rising()
            elif sort_method == 'controversial':
                submissions_generator = subreddit.controversial(time_filter='day')
            else:
                submissions_generator = subreddit.hot()
            
            for submission in submissions_generator:
                if len(posts) >= num_posts:
                    break

                # Take any post that has text content, ignoring images/links
                if submission.selftext:
                    posts.append({
                        'id': submission.id,
                        'title': submission.title,
                        'text': submission.selftext,
                        'score': submission.score,
                        'created_utc': submission.created_utc,
                        'url': submission.permalink,
                        'subreddit': str(submission.subreddit)
                    })
            
            return posts
            
        except Exception as e:
            self.logger.error(f'Error scraping subreddit: {str(e)}')
            return []

def main():
    """Main function to run the scraper from the command line."""
    parser = argparse.ArgumentParser(description="Scrape posts from Reddit.")
    parser.add_argument("--url", required=True, help="The Reddit URL to scrape (subreddit or post).")
    parser.add_argument("--num-posts", type=int, default=10, help="Number of posts to scrape.")
    parser.add_argument("--sort-by", type=str, default='hot', choices=['hot', 'new', 'top', 'rising', 'controversial'], help="The sort method for subreddit posts.")
    args = parser.parse_args()

    scraper = RedditScraper()
    try:
        posts = scraper.scrape_posts(args.url, args.num_posts, args.sort_by)
        # Print the result to stdout as a JSON string
        print(json.dumps(posts, indent=2))
    except Exception as e:
        scraper.logger.error(f"A critical error occurred: {e}", exc_info=True)
        # Print a specific error message to stderr for the backend to catch
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 