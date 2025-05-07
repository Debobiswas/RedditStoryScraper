import os
import re
import math
import random
import subprocess
import unicodedata

# Environment setup
os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"

# MoviePy Imports
from moviepy.editor import (
    VideoFileClip,
    AudioFileClip,
    TextClip,
    CompositeVideoClip,
    concatenate_videoclips,
    ImageClip,
)


# External Libraries
from pydub import AudioSegment
from pytube import YouTube
from pytube.exceptions import VideoUnavailable

# Project-Specific Modules
from config import TIKTOK_SESSION_ID
from tiktok_voice.main import tts as tiktok_tts
from reddit_scrapper import scrape_subreddit


def getYoutubeVids():
    url = input("Enter the URL of the video you want to download: ").strip()
    os.makedirs("Backgrounds", exist_ok=True)

    try:
        print("⬇️ Downloading video...")
        subprocess.run([
            "yt-dlp",
            "-f", "mp4",
            "-o", "Backgrounds/%(title).40s.%(ext)s",
            url
        ], check=True)
        print("✅ Download completed successfully!")
    except subprocess.CalledProcessError:
        print("❌ Failed to download the video.")


def upload_all_shorts():
    videos_folder = "Videos"
    if not os.path.exists(videos_folder):
        print("❌ 'Videos' folder does not exist.")
        return

    for filename in os.listdir(videos_folder):
        if filename.endswith(".mp4"):
            file_path = os.path.join(videos_folder, filename)
            title = os.path.splitext(filename)[0].replace("_", " ") + " #shorts"
            description = (
                "This video features a real story from Reddit, condensed into a short, engaging format. "
                "We share the most viral, emotional, funny, and unbelievable stories from subreddits like r/AskReddit, "
                "r/EntitledParents, r/Confession, and more.\n\n"
                "#Reddit #YouTubeShorts #StoryTime #RedditStories #Shorts"
            )
            print(f"📤 Uploading as YouTube Short: {filename}")
            try:
                subprocess.run([
                    "youtube-upload",
                    f"--title={title}",
                    f"--description={description}",
                    "--privacy=public",
                    "--client-secrets=client_secrets.json",
                    file_path
                ], check=True)

                print(f"✅ Uploaded: {filename}")
                os.remove(file_path)
                print(f"🗑️ Deleted: {filename}")

            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to upload {filename}: {e}")

def clean_text(text):
    text = re.sub(r'\*{1,2}(.*?)\*{1,2}', r'\1', text)  # Bold/italic markdown
    text = re.sub(r'~~(.*?)~~', r'\1', text)            # Strikethrough markdown
    text = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', text)     # Inline code markdown

    text = ' '.join(text.strip().split())               # Extra spaces
    text = re.sub(r'(?<!\.)\.\.(?!\.)', '...', text)     # Fix ".." to "..."
    text = re.sub(r'([.,!?])([^\s])', r'\1 \2', text)    # Ensure space after punctuation

    return text



def generate_tiktok_voice(text, output_file, voice="en_us_010"):
    print(f"\n🎤 Generating TikTok voice for: {output_file}")

    chunk_size = 250
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
    audio_segments = []
    chunk_durations = []

    for i, chunk in enumerate(chunks):
        chunk_file = f"chunk_{i}.mp3"
        result = tiktok_tts(
            session_id=TIKTOK_SESSION_ID,
            text_speaker=voice,
            req_text=chunk,
            filename=chunk_file
        )

        if result["status_code"] != 0:
            print(f"❌ Error on chunk {i}: {result['status']}")
            return {"status_code": result["status_code"], "chunk_durations": []}

        audio_segment = AudioSegment.from_file(chunk_file, format="mp3")
        audio_segments.append(audio_segment)
        chunk_durations.append(audio_segment.duration_seconds)
        os.remove(chunk_file)

    final_audio = sum(audio_segments)
    final_audio.export(output_file, format="mp3")
    print(f"✅ Voiceover saved: {output_file}")
    return {"status_code": 0, "chunk_durations": chunk_durations}


def create_video(audio_path, video_path, output_path, subtitle_text="", title_text="", progress_callback=None, chunk_durations=None, subtitle_chunks=None):
    video = VideoFileClip(video_path)
    audio = AudioFileClip(audio_path)

    # 📱 Format for vertical screen
    target_resolution = (1080, 1920)
    video = video.resize(height=1920)
    video = video.crop(x_center=video.w / 2, width=1080)
    print(f"📱 Resized to 9:16")

    # 🔁 Loop video if too short
    if video.duration < audio.duration:
        loops = math.ceil(audio.duration / video.duration)
        video = concatenate_videoclips([video] * loops).subclip(0, audio.duration)
    else:
        video = video.subclip(0, audio.duration)

    final_video = video.set_audio(audio)

    # Start with base video
    overlay_clips = [final_video]

    # 🗨️ Add title bubble overlay
    if title_text.strip():
        print(f"🖼️ Title for overlay: {title_text}")
        title_duration = 3.0  # Fixed title duration
        bubble = ImageClip("IntroPicture.png").resize(1.75).set_duration(title_duration).set_position(("center", 275))

        title_text_clip = TextClip(
            title_text,
            fontsize=70,
            font='Arial-Bold',
            color='black',
            stroke_color='black',
            stroke_width=4,
            method='caption',
            size=(bubble.w * 0.9, None)
        ).set_duration(title_duration).set_position(("center", 650))

        overlay_clips += [bubble.set_start(0), title_text_clip.set_start(0)]

    # 📝 Subtitles
    if chunk_durations and subtitle_chunks:
        # Adjust chunk durations for 1.2x speed
        speed_factor = 1.2
        adjusted_durations = [duration / speed_factor for duration in chunk_durations]
        
        start_time = 0  # Start subtitles from beginning
        print(f"🎬 Audio duration: {audio.duration:.2f}s")
        
        # Add all subtitle chunks, including title
        for i, (chunk, duration) in enumerate(zip(subtitle_chunks, adjusted_durations)):
            txt_clip = TextClip(
                chunk,
                fontsize=95,
                font='Arial-Black',
                color='white',
                stroke_color='black',
                stroke_width=6,
                method='caption',
                size=(1000, None)
            ).set_start(start_time).set_duration(duration).set_position(("center", final_video.h * 0.65))
            
            overlay_clips.append(txt_clip)
            start_time += duration
            print(f"  Chunk {i} duration: {duration:.2f}s, Next start: {start_time:.2f}s")
    else:
        # Fallback: old method
        # Combine title and subtitle text
        full_text = f"{title_text}. {subtitle_text}" if title_text else subtitle_text
        words = full_text.split()
        chunk_size = 4
        word_chunks = [' '.join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
        chunk_duration = audio.duration / len(word_chunks) if word_chunks else audio.duration
        
        for i, chunk in enumerate(word_chunks):
            txt_clip = TextClip(
                chunk,
                fontsize=95,
                font='Arial-Black',
                color='white',
                stroke_color='black',
                stroke_width=6,
                method='caption',
                size=(1000, None)
            ).set_start(i * chunk_duration).set_duration(chunk_duration).set_position(("center", final_video.h * 0.65))
            overlay_clips.append(txt_clip)

    # 🎬 Compose everything together
    final = CompositeVideoClip(overlay_clips, size=target_resolution)

    # Progress callback for video writing
    def moviepy_progress_callback(get_frame, t):
        if progress_callback:
            percent = min(99, int(70 + 30 * (t / final.duration)))
            progress_callback(percent)

    final.write_videofile(
        output_path,
        codec="libx264",
        audio_codec="aac",
        preset="ultrafast",
        threads=8
    )

    # Cleanup
    video.close()
    audio.close()
    final.close()

    if os.path.exists(audio_path):
        os.remove(audio_path)


def safe_filename(text):
    # Normalize to NFKD Unicode, encode to ASCII bytes, ignore errors, decode back to str
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    # Replace spaces with underscores
    text = text.replace(' ', '_')
    # Replace any remaining non-alphanumeric, non-underscore, non-dash chars with underscore
    return re.sub(r'[^a-zA-Z0-9_-]', '_', text).lower()


def speed_up_audio(input_path, output_path, speed_factor=1.1):
    audio = AudioSegment.from_file(input_path)
    faster_audio = audio._spawn(audio.raw_data, overrides={
        "frame_rate": int(audio.frame_rate * speed_factor)
    }).set_frame_rate(audio.frame_rate)
    faster_audio.export(output_path, format="mp3")
    return output_path


def delete_all_videos():
    videos_folder = "Videos"
    if not os.path.exists(videos_folder):
        print("❌ 'Videos' folder does not exist.")
        return

    for filename in os.listdir(videos_folder):
        if filename.endswith(".mp4"):
            file_path = os.path.join(videos_folder, filename)
            os.remove(file_path)
            print(f"🗑️ Deleted: {filename}")


def get_background():
    folder = "Backgrounds"
    if not os.path.exists(folder):
        raise FileNotFoundError("❌ 'Backgrounds' folder not found.")
    videos = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".mp4")]
    if not videos:
        raise FileNotFoundError("❌ No .mp4 files in 'Backgrounds' folder.")
    return random.choice(videos)


def load_stories(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    stories = []
    current_story = []

    for line in lines:
        stripped = line.strip()
        if stripped == "":
            if current_story:
                title = current_story[0]
                body = " ".join(current_story[1:])
                stories.append((title, body))
                current_story = []
        else:
            current_story.append(stripped)

    if current_story:
        title = current_story[0]
        body = " ".join(current_story[1:])
        stories.append((title, body))

    return stories


def prettify_title(title):
    title = re.sub(r'[^\w\s]', '', title)
    title = ' '.join(word.capitalize() for word in title.split())
    return title[:100]


if __name__ == "__main__":
    user_input = input("Input 'Upload All','Make Vids', 'Scrape' or 'Exit': ").strip().lower()
    while True:
        if user_input == "download":
            getYoutubeVids()
        elif user_input == "upload all":
            upload_all_shorts()
        elif user_input == "scrape":
            subreddit = input("Enter subreddit URL: ").strip()
            num_posts = int(input("How many posts to scrape? ").strip())
            scrape_subreddit(subreddit, num_posts)
            print("✅ Done scraping.")
        elif user_input == "make vids":
            background_video = get_background()
            stories = load_stories("stories.txt")
            print(f"📚 Found {len(stories)} stories.")
            for idx, (title, body) in enumerate(stories, 1):
                print(f"\n🎙️ Story {idx}: {title}")
                # Include title in the text to be spoken
                full_text = f"{title}. {body}"
                cleaned = clean_text(full_text)
                base = safe_filename(title)[:40] or f"story_{idx}"
                audio_file = f"{base}.mp3"
                final_video = os.path.join("Videos", f"{base}.mp4")
                os.makedirs("Videos", exist_ok=True)
                if os.path.exists(final_video):
                    print(f"⏭️ Skipping '{final_video}' — already exists.")
                    continue
                
                # Generate audio for full text including title
                result = generate_tiktok_voice(cleaned, audio_file, voice="en_us_010")
                if result["status_code"] == 0:
                    # Speed up audio
                    sped_up_audio = f"{base}_fast.mp3"
                    speed_up_audio(audio_file, sped_up_audio, speed_factor=1.2)

                    # Split text into chunks (title will be first chunk)
                    chunk_size = 250
                    subtitle_chunks = [cleaned[i:i + chunk_size] for i in range(0, len(cleaned), chunk_size)]
                    
                    # Get prettified title for overlay
                    pretty_title = prettify_title(title)
                    
                    create_video(
                        sped_up_audio,
                        background_video,
                        final_video,
                        subtitle_text=cleaned,
                        title_text=pretty_title,  # Pass prettified title for overlay
                        chunk_durations=result["chunk_durations"],
                        subtitle_chunks=subtitle_chunks
                    )

                    if os.path.exists(sped_up_audio):
                        os.remove(sped_up_audio)
                else:
                    print(f"❌ Skipped: {title}")
            print("\n✅ All videos generated.")
        elif user_input == "delete all":
            delete_all_videos()
        elif user_input == "exit":
            break
        else:
            print("⚠️ Invalid input.")
        user_input = input("Input 'Upload All','Make Vids', 'Scrape' or 'Exit': ").strip().lower()