"""
Video editor for combining background video, audio, and captions
"""

import os
from pathlib import Path
from typing import List, Dict, Callable, Optional
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, TextClip, vfx, ImageClip
import moviepy.config as mpy_config
import random
from utils.logger import setup_logger

# Set the path to the ImageMagick binary using moviepy's config
mpy_config.change_settings({"IMAGEMAGICK_BINARY": r"C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe"})

class VideoEditor:
    def __init__(self):
        self.logger = setup_logger('video_editor')
        
        # Video configuration
        self.video_config = {
            'width': 1080,
            'height': 1920,  # Vertical format for social media
            'fps': 30,
            'codec': 'libx264',
            'audio_codec': 'aac'
        }
        
        # Caption styling
        self.caption_style = {
            'fontsize': 80,
            'color': 'white',
            'font': 'Impact',
            'stroke_color': 'black',
            'stroke_width': 6, # Increased for a thicker outline
            'method': 'caption'
        }
    
    def _create_intro_clip(self, intro_image_path: Path, title: str, title_duration: float, background_clip_size: tuple) -> CompositeVideoClip:
        """Creates the intro clip with a title overlay."""
        self.logger.info("Creating intro image with title overlay...")

        # 1. Create the base image clip
        intro_image = ImageClip(str(intro_image_path)).set_duration(title_duration)
        
        # 2. Create the title text clip
        title_clip = TextClip(
            title.upper(),
            fontsize=32,  # smaller font
            color='black',
            font='Impact',
            method='caption',
            size=(int(intro_image.w * 0.85), int(intro_image.h * 0.6)),  # taller box
            align='West' # Set text to be left-aligned
        ).set_duration(title_duration)

        # 3. Composite the title text onto the image
        intro_overlay = CompositeVideoClip([
            intro_image,
            # Position the top-left of the text clip
            title_clip.set_position((60, int(intro_image.h * 0.32)))  # very slight move up and left
        ]).set_duration(title_duration)

        # 4. Resize and position the final intro overlay
        background_width = background_clip_size[0]
        intro_overlay = intro_overlay.resize(width=background_width * 0.9)
        intro_overlay = intro_overlay.set_position(('center', 'center'))

        self.logger.info(f"Intro will be displayed for {title_duration:.2f} seconds.")
        return intro_overlay

    def create_story_video(
        self,
        background_video_path: Path,
        audio_clip_path: Path,
        captions: Dict,
        output_path: Path,
        intro_image_path: Path,
        title: str,
        title_duration: float,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Path:
        """
        Create the final story video with background, audio, and synchronized captions.
        
        Args:
            background_video: Path to background video file.
            audio_clip_path: Path to the single audio file.
            captions: The result dictionary from Whisper containing segment and word timings.
            output_path: Path to save the final video.
            intro_image_path: Path to the intro image to overlay.
            title: The text of the title to render on the intro image.
            title_duration: The duration to display the intro image.
            progress_callback: Optional callback for progress updates.
            
        Returns:
            Path to the created video file.
        """
        self.logger.info("Starting video creation with synchronized captions...")
        
        try:
            # Load the background video and audio clips
            self.logger.info("Loading background video and audio clips...")
            background_clip = VideoFileClip(str(background_video_path))
            audio_clip = AudioFileClip(str(audio_clip_path))
            self.logger.info("Clips loaded successfully.")

            # --- Video Duration Adjustment ---
            self.logger.info("Adjusting background video duration...")
            if background_clip.duration > audio_clip.duration:
                # If background is longer, trim a random segment
                self.logger.info("Background is longer than audio. Trimming a random segment.")
                start_time = random.uniform(0, background_clip.duration - audio_clip.duration)
                background_clip = background_clip.subclip(start_time, start_time + audio_clip.duration)
            else:
                # If background is shorter, loop it
                self.logger.info("Background is shorter than audio. Looping to match duration.")
                background_clip = background_clip.fx(vfx.loop, duration=audio_clip.duration)
            
            # Ensure background clip is exactly the audio duration
            background_clip = background_clip.set_duration(audio_clip.duration)
            self.logger.info("Background video duration adjusted.")

            # --- Video Resizing and Cropping ---
            self.logger.info("Resizing and cropping background video...")
            target_aspect_ratio = 9 / 16
            current_aspect_ratio = background_clip.w / background_clip.h
            
            if current_aspect_ratio > target_aspect_ratio:
                # Wider than target: crop width
                new_width = int(background_clip.h * target_aspect_ratio)
                background_clip = background_clip.crop(x_center=background_clip.w/2, width=new_width)
            else:
                # Taller than target: crop height
                new_height = int(background_clip.w / target_aspect_ratio)
                background_clip = background_clip.crop(y_center=background_clip.h/2, height=new_height)
            
            # Final resize to 1080x1920
            background_clip = background_clip.resize(width=1080, height=1920)
            self.logger.info("Background video resized and cropped.")

            # --- Create Intro with Title ---
            intro_overlay = self._create_intro_clip(
                intro_image_path=intro_image_path,
                title=title,
                title_duration=title_duration,
                background_clip_size=background_clip.size
            )

            # --- Caption Generation ---
            self.logger.info("Creating synchronized captions from Whisper segments...")
            caption_clips = self.create_caption_clips(captions, background_clip.size)
            self.logger.info(f"Generated {len(caption_clips)} caption clips.")

            # --- Final Composition ---
            self.logger.info("Compositing all clips together...")
            final_video = CompositeVideoClip([background_clip, intro_overlay, *caption_clips]).set_audio(audio_clip)
            self.logger.info("Composition complete.")
            
            # Write the final video file
            self.logger.info("Writing final video file... (This may take a while)")
            final_video.write_videofile(
                str(output_path), 
                codec='libx264', 
                audio_codec='aac',
                temp_audiofile='temp-audio.m4a', 
                remove_temp=True,
                logger='bar',  # This will print a progress bar to the console
                ffmpeg_params=['-nostdin'], # Prevents hanging
                fps=30 # Set output to 30 FPS for faster rendering
            )
            
            self.logger.info(f"Successfully created video: {output_path}")

        except Exception as e:
            self.logger.error(f"Error creating video: {e}")
            raise e

    def create_caption_clips(self, captions: Dict, screensize: tuple) -> List[TextClip]:
        """Creates a list of TextClip objects for the captions, grouped by 4 words."""
        clips = []
        max_width = screensize[0] - 100  # Leave a 50px margin on each side

        # First, flatten all words from all segments into a single list
        all_words = []
        for segment in captions.get('segments', []):
            for word in segment.get('words', []):
                all_words.append(word)

        # Process the words in chunks of 4
        chunk_size = 4
        for i in range(0, len(all_words), chunk_size):
            chunk = all_words[i:i + chunk_size]
            
            if not chunk:
                continue

            # Join the words in the chunk to form the caption text
            chunk_text = " ".join([word['word'].strip() for word in chunk])
            
            # Determine the start and end time of the chunk
            start_time = chunk[0]['start']
            end_time = chunk[-1]['end']
            duration = end_time - start_time

            # Create a TextClip for the chunk
            text_clip = TextClip(
                chunk_text.upper(),
                fontsize=self.caption_style['fontsize'],
                color=self.caption_style['color'],
                font=self.caption_style['font'],
                stroke_color=self.caption_style['stroke_color'],
                stroke_width=self.caption_style['stroke_width'],
                method=self.caption_style['method'],
                size=(max_width, None),
                align='center'
            ).set_position(('center', 'center')).set_duration(duration).set_start(start_time)
            
            clips.append(text_clip)

        self.logger.info(f"Created {len(clips)} caption clips from {len(all_words)} words.")
        return clips 