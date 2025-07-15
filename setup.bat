@echo off
echo 🚀 Setting up Reddit Story Video Generator...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

:: Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not installed. You can still run the project manually.
    set DOCKER_AVAILABLE=false
) else (
    set DOCKER_AVAILABLE=true
)

:: Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Reddit API Configuration
        echo REDDIT_CLIENT_ID=your_reddit_client_id
        echo REDDIT_CLIENT_SECRET=your_reddit_client_secret
        echo REDDIT_USER_AGENT=RedditStoryGenerator/1.0
        echo.
        echo # API Configuration
        echo NODE_ENV=development
        echo PORT=3001
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Video Processing
        echo MAX_VIDEO_LENGTH=300
        echo MAX_CONCURRENT_JOBS=3
        echo TEMP_DIR=./temp
        echo OUTPUT_DIR=./output
    ) > .env
    echo ✅ .env file created. Please update it with your Reddit API credentials.
)

:: Create necessary directories
echo 📁 Creating directories...
if not exist uploads mkdir uploads
if not exist output mkdir output
if not exist temp mkdir temp
if not exist logs mkdir logs

:: Install dependencies
echo 📦 Installing dependencies...
npm install

echo 📦 Installing frontend dependencies...
cd frontend && npm install && cd ..

echo 📦 Installing backend dependencies...
cd backend && npm install && cd ..

echo 📦 Installing Python dependencies...
cd video-processor && pip install -r requirements.txt && cd ..

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env file with your Reddit API credentials
echo 2. Get Reddit API credentials from: https://www.reddit.com/prefs/apps
echo.
echo 🚀 To start the application:
if "%DOCKER_AVAILABLE%"=="true" (
    echo    Docker:  docker-compose up --build
)
echo    Manual:  npm run dev
echo.
echo 🌐 The application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001

pause 