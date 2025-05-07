# Reddit Story Scraper

Create engaging short-form videos from real Reddit stories! This project scrapes stories from Reddit, generates TikTok-style voiceovers, and creates vertical videos with subtitles and background footage.

## Features
- Scrape stories from any subreddit
- Generate voiceovers using TikTok TTS (deep male voice)
- Create vertical videos with synced subtitles and a title overlay
- Manage and upload videos to YouTube Shorts
- Web interface and command-line support

---

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Debobiswas/reddit-story-scraper.git
cd reddit-story-scraper
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the project root (see `.env.example`):
```
TIKTOK_SESSION_ID=your_tiktok_session_id
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_user_agent
```
- **Never commit your `.env` file!**
- You can get Reddit API credentials from https://www.reddit.com/prefs/apps

### 4. Prepare Background Videos
Place your background `.mp4` videos in the `Backgrounds/` folder.

---

## Usage

### Command Line
Run the main script and follow the prompts:
```bash
python runthis.py
```
Options:
- `Scrape` — Scrape stories from a subreddit
- `Make Vids` — Generate videos from stories
- `Upload All` — Upload all videos to YouTube Shorts
- `Delete All` — Remove all generated videos

### Web App
Start the Flask web server:
```bash
python app.py
```
Then open [http://localhost:5000](http://localhost:5000) in your browser.

---

## Environment Variables
See `.env.example` for all required variables:
- `TIKTOK_SESSION_ID` — TikTok TTS session ID
- `REDDIT_CLIENT_ID` — Reddit API client ID
- `REDDIT_CLIENT_SECRET` — Reddit API client secret
- `REDDIT_USER_AGENT` — Reddit API user agent (e.g. `script:RedditStoryScraper:v1.0 (by /u/YourUsername)`)

---

## Deployment
- This is a Python Flask app. To deploy, use a Python-friendly host (Render, Railway, Heroku, etc.).
- Website builders like Wix or Squarespace **will not work** for this backend.
- Make sure to set your environment variables on your host.

---

## Security
- **Never commit your `.env` or any secrets to GitHub.**
- `.env` is already in `.gitignore`.

---

## License
MIT License 
