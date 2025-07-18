#!/bin/bash

echo "🚀 Setting up Reddit Story Video Generator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You can still run the project manually."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=RedditStoryGenerator/1.0

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# API Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Video Processing
MAX_VIDEO_LENGTH=300
MAX_CONCURRENT_JOBS=3
TEMP_DIR=./temp
OUTPUT_DIR=./output
EOF
    echo "✅ .env file created. Please update it with your Reddit and OpenRouter API credentials."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads output temp logs

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing Python dependencies..."
cd video-processor && pip install -r requirements.txt && cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your Reddit and OpenRouter API credentials"
echo "2. Get Reddit API credentials from: https://www.reddit.com/prefs/apps"
echo "   Get OpenRouter API key from: https://openrouter.ai"
echo ""
echo "🚀 To start the application:"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   Docker:  docker-compose up --build"
fi
echo "   Manual:  npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001" 