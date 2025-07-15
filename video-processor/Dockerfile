FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    wget \
    build-essential \
    rustc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads output temp logs temp/whisper_models

# Make script executable
RUN chmod +x generate_video.py generate_video_from_text.py

# Keep container running
CMD ["python", "-u", "generate_video.py", "--help"] 