# Project Change History

## 2025-07-16 at 05:11 - Backend YouTube Download Fix

### Modified Files
- `backend/Dockerfile`
- `docker-compose.yml`
- `backend/src/routes/backgrounds.js`

### Change Description
- Added Python3 and yt-dlp installation to backend Dockerfile
- Mounted `video-processor` directory in backend service via docker-compose
- Updated background download route to use `python3`, log output, and remove detached spawn

### Rationale
- Enable YouTube video downloads from the backend container
- Surface errors from the Python download process for easier debugging

### Potential Impacts
- Backend image size increases slightly due to Python installation
- Download logs now appear in backend container output

### Implemented By
- AI Assistant

## 2025-07-18 at 01:41 - AI Story Chat Page

### Modified Files
- `backend/src/routes/chat.js`
- `backend/src/index.js`
- `docker-compose.yml`
- `frontend/src/app/story-ai/page.tsx`
- `frontend/src/app/layout.tsx`
- `README.md`

### Change Description
- Added new backend route proxying to OpenRouter API for AI chat
- Registered `/api/chat` route in Express server and environment variable
- Created story AI page in frontend with chat interface using the route
- Linked new page in site navigation
- Documented new environment variable and feature

### Rationale
- Allow users to generate story ideas via AI chat
- Provide direct OpenRouter integration for brainstorming scripts

### Potential Impacts
- Requires `OPENROUTER_API_KEY` environment variable
- Chat API errors may be surfaced to users

### Implemented By
- AI Assistant

## 2025-07-18 at 01:01 - Fix Invalid TTS Rate

### Modified Files
- `video-processor/text_to_speech.py`

### Change Description
- Replaced invalid `'default'` rate values for male and jenny voices with `'+0%'`
  to comply with edge-tts requirements.

### Rationale
- Prevent runtime errors when generating speech previews.

### Potential Impacts
- TTS output speed for male and jenny voices now matches the default rate.

### Implemented By
- AI Assistant

## 2024-02-15 at 15:45 - YouTube Downloader Implementation

### Modified Files
- Created `video-processor/youtube_downloader.py`

### Change Description
- Implemented `YouTubeDownloader` class
- Added video download functionality using yt-dlp
- Created method for downloading background videos
- Implemented robust error handling and logging
- Added placeholder URLs for different video categories

### Rationale
- Resolve missing YouTube video download functionality
- Provide a flexible and extensible video download mechanism
- Ensure proper error tracking and logging
- Support background video selection for different categories

### Potential Impacts
- Enables background video downloads for video generation
- Improves video processor's flexibility
- Adds logging for better debugging and tracking
- Provides a template for future video download enhancements

### Implemented By
- AI Assistant

## 2024-02-15 at 14:30 - Project Documentation Setup

### Modified Files
- Created `INSTRUCTIONS.md`
- Created `history.md`

### Change Description
- Added comprehensive project development instructions
- Established mandatory workflow for AI assistants
- Created a structured change logging system
- Implemented guidelines for code changes and documentation

### Rationale
- Improve project onboarding and development consistency
- Create a clear tracking mechanism for project changes
- Establish best practices for code modifications
- Enhance project maintainability and knowledge transfer

### Potential Impacts
- Standardizes change documentation process
- Provides clear guidelines for future development
- Improves traceability of project evolution
- Helps new contributors understand project history

### Implemented By
- AI Assistant

## 2024-02-15 at 09:45 - Project Initialization

### Project Setup
- Created initial project structure
- Set up frontend with Next.js and Tailwind CSS
- Implemented backend API scaffolding
- Developed video processing scripts in Python

### Initial Components
- Reddit scraper module
- Text-to-speech generator
- Video editing utilities
- Background video provider

### First Commit Details
- Established core project architecture
- Created Docker configuration
- Set up dependency management
- Implemented basic workflow for video generation

### Initial Challenges Addressed
- API integration with Reddit
- Video processing pipeline
- Cross-language (Python/Node.js) communication
- Containerization of services

### Implemented By
- Initial Project Setup Team 
## 2025-07-17 at 23:29 - Multiple Voice Selection and Preview

### Modified Files
- `video-processor/text_to_speech.py`
- `video-processor/tts_preview.py`
- `backend/src/routes/tts.js`
- `backend/src/index.js`
- `frontend/src/app/generate/page.tsx`

### Change Description
- Added additional voice configurations (Aria, Jenny, Guy, Davis)
- Created new Python script and backend route for generating short voice previews
- Registered `/api/tts` routes in backend server
- Updated frontend generation page with new voice options and a Preview button

### Rationale
- Allow users to choose from multiple text-to-speech voices
- Enable quick audio previews before generating full videos

### Potential Impacts
- Requires Python environment to run new preview script
- Slight increase in backend complexity and API surface

### Implemented By
- AI Assistant
