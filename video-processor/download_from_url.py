import argparse
import sys
import re
from pathlib import Path
import yt_dlp
from youtube_downloader import YouTubeDownloader

def sanitize_filename(filename):
    """Removes illegal characters from a filename."""
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def main():
    print("--- Starting download_from_url.py ---", file=sys.stderr)
    parser = argparse.ArgumentParser(description="Download a single YouTube video to a specific directory.")
    parser.add_argument("--url", required=True, help="The URL of the YouTube video to download.")
    parser.add_argument("--output-dir", required=True, help="The directory to save the downloaded video.")
    args = parser.parse_args()
    print("--- Args parsed ---", file=sys.stderr)

    try:
        downloader = YouTubeDownloader()
        output_dir = Path(args.output_dir)

        # Use yt-dlp to safely extract video info
        print("--- Extracting video info... ---", file=sys.stderr)
        with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
            info = ydl.extract_info(args.url, download=False)
            video_id = info.get('id')
            title = info.get('title', video_id) # Fallback to ID if title is missing
            if not video_id:
                raise Exception(f"Could not extract video ID from URL: {args.url}")
        print("--- Video info extracted ---", file=sys.stderr)
        
        # Sanitize the title and create a unique filename
        sanitized_title = sanitize_filename(title)
        output_path = output_dir / f"{sanitized_title}.mp4"

        print(f"--- Starting download for URL: {args.url} ---", file=sys.stderr)
        
        downloader._download_video(args.url, output_path, duration=None)
        
        print("--- Download finished, providing path to backend ---", file=sys.stderr)
        # Output the full, clean path of the created file
        print(output_path)
            
    except Exception as e:
        print(f"--- An error occurred: {e} ---", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 