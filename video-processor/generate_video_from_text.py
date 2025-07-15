#!/usr/bin/env python3
"""
Video generation script for custom text input
"""

import os
import sys
import logging
import argparse
import tempfile
from pathlib import Path
import subprocess
import asyncio
import re

# from alt_profanity_check import predict

from background_provider import BackgroundProvider
from text_to_speech import TextToSpeechGenerator
from caption_generator import CaptionGenerator
from video_editor import VideoEditor
from utils.logger import setup_logger
from moviepy.editor import AudioFileClip

# --- Text Cleaning Function ---
def clean_text(text: str) -> str:
    """Removes markdown, URLs, and extra whitespace from text."""
    # Remove Reddit markdown
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # Links
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)      # Bold
    text = re.sub(r'\*([^*]+)\*', r'\1', text)          # Italics
    text = re.sub(r'~~([^~]+)~~', r'\1', text)          # Strikethrough
    text = re.sub(r'^&gt;\s*', '', text, flags=re.MULTILINE)  # Quotes
    text = re.sub(r'&lt;', '<', text)                   # HTML entities
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&amp;', '&', text)
    
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text
# ---

def get_audio_duration(audio_file_path):
    """
    Get the duration of an audio file in seconds.
    """
    try:
        # Convert the Path object to a string for moviepy
        with AudioFileClip(str(audio_file_path)) as audio:
            return audio.duration
    except Exception as e:
        logging.error(f"Error getting audio duration: {e}", exc_info=True)
        return 0.0

def main(args):
    parser = argparse.ArgumentParser(description='Generate videos from custom text')
    parser.add_argument('--job-id', required=True, help='Job ID for tracking')
    parser.add_argument('--text-file', required=True, help='Path to text file')
    parser.add_argument('--voice-type', default='female', help='Voice type for TTS')
    parser.add_argument('--background-type', default='minecraft', help='Background video type')
    parser.add_argument('--output-path', required=True, help='Output video path')
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logger(f'video_gen_text_{args.job_id}')
    logger = logging.getLogger(f'video_gen_text_{args.job_id}')

    def update_progress(progress):
        print(f'PROGRESS:{progress}')
        sys.stdout.flush()

    logger.info(f'Starting video generation for job {args.job_id}')
    update_progress(5)

    audio_file_path = None
    title_audio_path = None
    body_audio_path = None
    try:
        update_progress(10)
        
        # --- Step 1: Read and filter text ---
        logger.info("Reading and filtering text file...")
        with open(args.text_file, 'r', encoding='utf-8') as f:
            full_text = f.read()

        # --- Separate and Clean Title and Body ---
        lines = full_text.split('\\n')
        
        original_title = lines[0]
        original_body = '\\n'.join(lines[1:]).strip()
        
        title = clean_text(original_title)
        body = clean_text(original_body)

        # If cleaning makes the title empty, fall back to the original.
        if not title:
            title = original_title

        if not body: # If there's no body after the first line, use the whole text as the body
            body = title
            title = "Reddit Story" # Default title
        # ---

        # Filter profanity from the body (commented out)
        # body_sentences = body.split('. ')
        # profanity_results = predict(body_sentences)
        # clean_sentences = [sentence for sentence, profane in zip(body_sentences, profanity_results) if not profane]
        # body = '. '.join(clean_sentences)

        # The full, cleaned text for the main audio track.
        cleaned_full_text = f"{title}. {body}"

        logger.info("Starting video generation process...")
        update_progress(15)

        # --- Step 2: Generate all audio clips ---
        logger.info('Generating text-to-speech for full text...')
        tts_generator = TextToSpeechGenerator(voice_type=args.voice_type)
        
        # Create temporary files for all audio clips
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_full_audio, \
             tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_title_audio, \
             tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_body_audio:
            audio_file_path = Path(temp_full_audio.name)
            title_audio_path = Path(temp_title_audio.name)
            body_audio_path = Path(temp_body_audio.name)

        # Generate all three audio versions
        tts_generator.generate_speech(cleaned_full_text, audio_file_path)
        tts_generator.generate_speech(title, title_audio_path)
        tts_generator.generate_speech(body, body_audio_path)

        # Get durations
        title_duration = get_audio_duration(title_audio_path)
        logger.info(f"Title duration: {title_duration:.2f}s")
        update_progress(30)

        # --- Step 2.5: Verify intro image exists ---
        intro_image_path = Path(__file__).parent / 'assets' / 'IntroPicture.png'
        if not intro_image_path.is_file():
            logger.error(f"Intro image not found at path: {intro_image_path}")
            raise FileNotFoundError(f"Intro image not found at path: {intro_image_path}")
        logger.info("Intro image found successfully.")
        
        # --- Step 3: Get background video ---
        logger.info('Getting background video...')
        provider = BackgroundProvider()
        background_video_path = provider.get_background_video(args.background_type)
        update_progress(50)

        # --- Step 4: Generate captions ---
        logger.info('Generating synchronized captions with Whisper...')
        caption_gen = CaptionGenerator()
        # Generate captions from the body audio and offset them
        captions = caption_gen.generate_captions(body_audio_path, offset_time=title_duration)
        update_progress(80)
        
        # --- Step 5: Create final video ---
        logger.info('Creating final video...')
        video_editor = VideoEditor()

        video_editor.create_story_video(
            background_video_path=background_video_path,
            audio_clip_path=audio_file_path,
            captions=captions,
            output_path=args.output_path,
            intro_image_path=intro_image_path,
            title=title,
            title_duration=title_duration,
            progress_callback=lambda p: update_progress(80 + p * 0.2)
        )

        update_progress(100)
        logger.info("Video generation complete.")

    except Exception as e:
        logger.error(f"Error generating video: {e}", exc_info=True)
        print(f'ERROR:{str(e)}')
        sys.exit(1)
        
    finally:
        # --- Cleanup ---
        if audio_file_path and os.path.exists(audio_file_path):
            logger.info(f"Cleaning up temporary audio file: {audio_file_path}")
            os.remove(audio_file_path)
        if title_audio_path and os.path.exists(title_audio_path):
            logger.info(f"Cleaning up temporary title audio file: {title_audio_path}")
            os.remove(title_audio_path)
        if body_audio_path and os.path.exists(body_audio_path):
            logger.info(f"Cleaning up temporary body audio file: {body_audio_path}")
            os.remove(body_audio_path)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate a video from text.')
    parser.add_argument('--job-id', required=True, help='Job ID for tracking')
    parser.add_argument('--text-file', required=True, help='Path to text file')
    parser.add_argument('--voice-type', default='female', help='Voice type for TTS')
    parser.add_argument('--background-type', default='minecraft', help='Background video type')
    parser.add_argument('--output-path', required=True, help='Output video path')
    args = parser.parse_args()
    main(args) 