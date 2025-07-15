import yt_dlp
from pathlib import Path
from typing import Optional
from utils.logger import setup_logger

class YouTubeDownloader:
    def __init__(self):
        """
        Initialize the YouTube downloader with logging.
        """
        self.logger = setup_logger('youtube_downloader')

    def _download_video(self, url: str, output_path: Path, duration: Optional[float] = None):
        """
        Download a YouTube video using yt-dlp.
        
        Args:
            url: YouTube video URL
            output_path: Path to save the downloaded video
            duration: Optional duration to limit video length
        
        Returns:
            Path to the downloaded video file
        """
        try:
            # Prepare yt-dlp options
            ydl_opts = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'outtmpl': str(output_path),
                'nooverwrites': True,
                'no_color': True,
                'quiet': False,
                'no_warnings': False,
            }

            # If duration is specified, add trimming options
            if duration:
                ydl_opts.update({
                    'download_ranges': lambda info: [(0, duration)]
                })

            # Perform the download
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            # Verify the file was downloaded
            if not output_path.is_file():
                raise FileNotFoundError(f"Video download failed: {output_path}")

            self.logger.info(f"Successfully downloaded video to {output_path}")
            return output_path

        except Exception as e:
            self.logger.error(f"Error downloading video from {url}: {e}")
            raise

    def download_background_video(self, category: str, duration: float, output_path: Path) -> Path:
        """
        Download a background video of a specific category and duration.
        
        Args:
            category: Type of background video (e.g., 'minecraft')
            duration: Desired video duration
            output_path: Path to save the downloaded video
        
        Returns:
            Path to the downloaded video file
        """
        # Mapping of background categories to sample YouTube URLs
        background_urls = {
            'minecraft': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',  # Placeholder URL
            'gaming': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',    # Placeholder URL
            'nature': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',   # Placeholder URL
            'default': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'   # Fallback URL
        }

        # Select URL based on category, fallback to default if not found
        url = background_urls.get(category.lower(), background_urls['default'])
        
        self.logger.info(f"Downloading background video for category '{category}'")
        
        return self._download_video(url, output_path, duration) 