# Reddit Story Video Generator

A full-stack application that automatically creates narrated Reddit story videos with background footage and captions.

## Features

- 🎬 **Automated Video Creation**: Generate professional-looking story videos
- 📝 **Reddit Integration**: Scrape posts from any Reddit URL
- 🎵 **Text-to-Speech**: Convert Reddit text to natural-sounding narration
- 🎥 **Background Videos**: Download and use YouTube videos as backgrounds
- 📱 **Modern UI**: Clean, responsive frontend interface
- 🔧 **Configurable**: Customize video length, voice, background type, and more

## Tech Stack

- **Frontend**: React with Next.js, Tailwind CSS
- **Backend**: Node.js with Express
- **Video Processing**: Python with MoviePy, yt-dlp
- **Text-to-Speech**: Google TTS / OpenAI TTS
- **Database**: SQLite for job tracking
- **Deployment**: Docker & Docker Compose

## Quick Start

```bash
# Clone and setup
git clone <your-repo>
cd RedditStories

# Copy environment file
cp .env.example .env

# Add your Reddit API credentials to .env
# Get them from: https://www.reddit.com/prefs/apps

# Start with Docker (recommended)
docker-compose up --build

# Or start manually
npm install
cd frontend && npm install && npm run dev &
cd backend && npm install && npm run dev &
cd video-processor && pip install -r requirements.txt
```

## Project Structure

```
RedditStories/
├── frontend/          # React frontend application
├── backend/           # Node.js API server
├── video-processor/   # Python video generation scripts
├── docker/            # Docker configuration files
├── uploads/           # Temporary file storage
├── output/            # Generated video files
└── temp/              # Temporary processing files
```

## Usage

1. **Enter Reddit URL**: Paste any Reddit post or subreddit URL
2. **Configure Settings**: Choose number of posts, video length, voice type
3. **Select Background**: Choose background video category
4. **Generate**: Click generate and wait for processing
5. **Download**: Get your finished video file

## Configuration

### Reddit API Setup
1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (script type)
3. Copy client ID and secret to `.env` file

### Environment Variables
- **REDDIT_CLIENT_ID**: Your Reddit app client ID
- **REDDIT_CLIENT_SECRET**: Your Reddit app client secret
- **REDDIT_USER_AGENT**: Your app user agent string

## API Endpoints

- `POST /api/video/generate` - Start video generation
- `GET /api/video/job/:id` - Get job status
- `GET /api/health` - Health check

## Development

```bash
# Frontend development
cd frontend
npm run dev

# Backend development
cd backend
npm run dev

# Python video processor
cd video-processor
python generate_video.py --help
```

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Troubleshooting

- **Reddit API Issues**: Ensure credentials are correct in `.env`
- **Video Download Fails**: Check internet connection and YouTube availability
- **TTS Issues**: Verify TTS service configuration
- **Memory Issues**: Reduce concurrent jobs or video quality

## License

MIT License - see LICENSE file for details 