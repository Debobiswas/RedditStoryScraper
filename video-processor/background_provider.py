"""
Provides background video clips from a local folder.
"""

import os
import random
from pathlib import Path
from utils.logger import setup_logger

class BackgroundProvider:
    def __init__(self):
        self.logger = setup_logger('background_provider')
        # Assuming the script is run from the root of the video-processor directory
        self.downloads_dir = Path(__file__).parent.parent / 'downloads'
        self.logger.info(f"Looking for background videos in: {self.downloads_dir}")

    def get_background_video(self, category: str) -> Path:
        """
        Get a random background video from the specified category folder.
        
        Args:
            category: The category (subdirectory) to look for videos in.
            
        Returns:
            Path to a randomly selected video file.
        """
        try:
            category_path = self.downloads_dir / category
            if not category_path.is_dir():
                raise FileNotFoundError(f"Background video category folder not found: {category_path}")

            video_files = [f for f in category_path.iterdir() if f.is_file() and f.suffix.lower() in ['.mp4', '.mov', '.webm']]
            
            if not video_files:
                raise FileNotFoundError(f"No background videos found in category: {category}")

            selected_video = random.choice(video_files)
            self.logger.info(f"Selected background video: {selected_video}")
            return selected_video
            
        except Exception as e:
            self.logger.error(f'Error getting background video: {str(e)}')
            raise 