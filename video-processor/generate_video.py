#!/usr/bin/env python3
"""
Main video generation script that orchestrates the entire process
"""

import sys
import argparse
import os
import tempfile
from pathlib import Path

from reddit_scraper import RedditScraper
from youtube_downloader import YouTubeDownloader
from text_to_speech import TextToSpeechGenerator
from video_editor import VideoEditor
from caption_generator import CaptionGenerator
from utils.logger import setup_logger
from moviepy.editor import AudioFileClip, concatenate_audioclips

def main():
    parser = argparse.ArgumentParser(description='Generate Reddit story videos')
    parser.add_argument('--job-id', required=True, help='Job ID for tracking')
    parser.add_argument('--reddit-url', required=True, help='Reddit URL to scrape')
    parser.add_argument('--num-posts', type=int, default=1, help='Number of posts to include')
    parser.add_argument('--voice-type', default='female', help='Voice type for TTS')
    parser.add_argument('--background-type', default='minecraft', help='Background video type')
    parser.add_argument('--output-path', required=True, help='Output video path')
    
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logger(f'video_gen_{args.job_id}')
    
    try:
        def update_progress(progress):
            print(f'PROGRESS:{progress}')
            sys.stdout.flush()
        
        logger.info(f'Starting video generation for job {args.job_id}')
        update_progress(5)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Step 1: Scrape Reddit posts
            logger.info('Scraping Reddit posts...')
            scraper = RedditScraper()
            posts = scraper.scrape_posts(args.reddit_url, args.num_posts)
            if not posts:
                raise Exception("No posts were scraped.")
            update_progress(15)

            # Step 2: Generate text-to-speech for all posts
            logger.info('Generating text-to-speech...')
            tts_generator = TextToSpeechGenerator(args.voice_type)
            # Combine text from all posts into one block for a single audio file
            full_text = " ".join([post['text'] for post in posts])
            audio_file = temp_path / 'combined_audio.wav'
            tts_generator.generate_speech(full_text, audio_file)
            update_progress(30)

            # Step 3: Get audio duration
            with AudioFileClip(str(audio_file)) as audio_clip:
                audio_duration = audio_clip.duration
            logger.info(f'Total audio duration: {audio_duration:.2f} seconds')
            update_progress(35)

            # Step 4: Download background video
            logger.info('Downloading background video...')
            downloader = YouTubeDownloader()
            background_video = downloader.download_background_video(
                args.background_type, 
                audio_duration,
                temp_path / 'background.mp4'
            )
            update_progress(50)

            # Step 5: Generate captions using Whisper
            logger.info('Generating synchronized captions with Whisper...')
            caption_gen = CaptionGenerator()
            captions = caption_gen.generate_captions(audio_file)
            update_progress(80)
            
            # Step 6: Create final video
            logger.info('Creating final video...')
            video_editor = VideoEditor()
            video_editor.create_story_video(
                background_video=background_video,
                audio_clip_path=audio_file,
                captions=captions,
                output_path=args.output_path,
                progress_callback=lambda p: update_progress(80 + (p * 0.20))
            )
            
            update_progress(100)
            logger.info(f'Video generation completed: {args.output_path}')
            
    except Exception as e:
        logger.error(f'Error generating video: {str(e)}')
        print(f'ERROR:{str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    main() 