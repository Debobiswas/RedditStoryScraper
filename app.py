from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from flask_socketio import SocketIO, emit
import os
import json
import time
import threading
import socket
from werkzeug.utils import secure_filename
from reddit_scrapper import scrape_subreddit
from runthis import create_video, generate_tiktok_voice, get_background, speed_up_audio, load_stories, safe_filename, upload_all_shorts

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['UPLOAD_FOLDER'] = 'Backgrounds'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Try different ports if the default one is in use
def find_available_port(start_port=5000, max_port=5050):
    for port in range(start_port, max_port + 1):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('127.0.0.1', port))
            sock.close()
            return port
        except OSError:
            continue
    raise RuntimeError("No available ports found")

# Initialize SocketIO with a specific port
port = find_available_port()
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# Global state for background tasks
active_tasks = {}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('Videos', exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json
    subreddit = data.get('subreddit')
    num_posts = int(data.get('num_posts', 1))
    
    try:
        # Save to both CSV and text files
        csv_file = 'stories.csv'
        result = scrape_subreddit(subreddit, num_posts, csv_file)
        if result:
            return jsonify({'status': 'success', 'message': 'Stories scraped and saved successfully'})
        else:
            return jsonify({'status': 'error', 'message': 'No valid stories found'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/stories')
def get_stories():
    try:
        if not os.path.exists('stories.csv'):
            return jsonify([])
            
        import pandas as pd
        df = pd.read_csv('stories.csv')
        stories = []
        for index, row in df.iterrows():
            stories.append({
                'id': index,
                'title': row['title'],
                'content': row['body'],
                'upvotes': row['upvotes'],
                'url': row['url']
            })
        return jsonify(stories)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/delete_story', methods=['POST'])
def delete_story():
    try:
        data = request.json
        story_id = data.get('id')
        
        if not os.path.exists('stories.csv'):
            return jsonify({'status': 'error', 'message': 'No stories file found'})
            
        import pandas as pd
        df = pd.read_csv('stories.csv')
        
        if story_id >= len(df):
            return jsonify({'status': 'error', 'message': 'Invalid story ID'})
            
        # Remove the story
        df = df.drop(story_id)
        df.to_csv('stories.csv', index=False)
        
        return jsonify({'status': 'success', 'message': 'Story deleted successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/backgrounds')
def get_backgrounds():
    try:
        print(f"\n[Backgrounds Endpoint] Accessing backgrounds directory: {app.config['UPLOAD_FOLDER']}")
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            print("[Backgrounds Endpoint] Creating backgrounds directory")
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            
        backgrounds = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) 
                      if f.endswith(('.mp4', '.mov', '.avi'))]
        print(f"[Backgrounds Endpoint] Found {len(backgrounds)} background videos:")
        for bg in backgrounds:
            print(f"  - {bg}")
            
        if not backgrounds:
            print("[Backgrounds Endpoint] Warning: No background videos found")
            
        return jsonify(backgrounds)
    except Exception as e:
        print(f"[Backgrounds Endpoint] Error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/upload_background', methods=['POST'])
def upload_background():
    if 'background' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file uploaded'})
    
    file = request.files['background']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No file selected'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'status': 'success', 'message': 'File uploaded successfully'})
    
    return jsonify({'status': 'error', 'message': 'Invalid file type'})

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'mp4', 'mov', 'avi'}

@app.route('/create_video', methods=['POST'])
def create_video_endpoint():
    data = request.json
    stories = data.get('stories', [])
    background = data.get('background')
    
    if not stories:
        return jsonify({'status': 'error', 'message': 'No stories selected'})
    
    task_id = str(int(time.time()))
    active_tasks[task_id] = {
        'status': 'processing',
        'progress': 0,
        'total_stories': len(stories),
        'completed_stories': 0,
        'current_story': 0
    }
    
    def process_videos():
        try:
            for i, story in enumerate(stories):
                active_tasks[task_id]['current_story'] = i + 1
                
                # Generate audio
                audio_file = f"temp_{task_id}_{i}.mp3"
                generate_tiktok_voice(f"{story['title']}. {story['content']}", audio_file)
                active_tasks[task_id]['progress'] = 30
                
                # Speed up audio
                fast_audio = f"fast_{task_id}_{i}.mp3"
                speed_up_audio(audio_file, fast_audio)
                active_tasks[task_id]['progress'] = 60
                
                # Get background video
                if background:
                    background_path = os.path.join(app.config['UPLOAD_FOLDER'], background)
                else:
                    background_path = get_background()
                active_tasks[task_id]['progress'] = 70
                
                # Create final video
                output_file = f"Videos/{safe_filename(story['title'])[:40]}.mp4"
                def progress_callback(percent):
                    active_tasks[task_id]['progress'] = percent
                create_video(fast_audio, background_path, output_file, story['content'], story['title'], progress_callback=progress_callback)
                active_tasks[task_id]['progress'] = 100
                
                # Cleanup
                os.remove(audio_file)
                os.remove(fast_audio)
                
                # Update progress
                active_tasks[task_id]['completed_stories'] += 1
                active_tasks[task_id]['progress'] = 0  # Reset for next story
            
            active_tasks[task_id]['status'] = 'completed'
            active_tasks[task_id]['message'] = f'Successfully created {len(stories)} videos'
            
        except Exception as e:
            active_tasks[task_id]['status'] = 'error'
            active_tasks[task_id]['error'] = str(e)
    
    thread = threading.Thread(target=process_videos)
    thread.start()
    
    return jsonify({'status': 'success', 'task_id': task_id})

@app.route('/task_status/<task_id>')
def task_status(task_id):
    if task_id in active_tasks:
        task = active_tasks[task_id]
        if task['status'] == 'processing':
            # Calculate overall progress
            total_progress = (task['completed_stories'] * 100 + task['progress']) / task['total_stories']
            task['overall_progress'] = total_progress
            task['message'] = f'Processing story {task["current_story"]} of {task["total_stories"]}'
        return jsonify(task)
    return jsonify({'status': 'error', 'message': 'Task not found'})

@app.route('/download/<path:filename>')
def download_file(filename):
    return send_file(filename, as_attachment=True)

@app.route('/videos/<path:filename>')
def serve_video(filename):
    return send_from_directory('Videos', filename)

@app.route('/videos')
def list_videos():
    try:
        videos = [f for f in os.listdir('Videos') if f.endswith('.mp4')]
        return jsonify(videos)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/delete_video/<path:filename>', methods=['DELETE'])
def delete_video(filename):
    try:
        video_path = os.path.join('Videos', filename)
        if os.path.exists(video_path):
            os.remove(video_path)
            return jsonify({'status': 'success', 'message': f'Video {filename} deleted successfully'})
        else:
            return jsonify({'status': 'error', 'message': 'Video not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    emit('connected', {'data': 'Connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@app.route('/upload_youtube', methods=['POST'])
def upload_youtube():
    try:
        upload_all_shorts()
        return jsonify({'status': 'success', 'message': 'All shorts uploaded to YouTube.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/cleanup_temp_audio', methods=['POST'])
def cleanup_temp_audio():
    try:
        deleted = 0
        for filename in os.listdir('Videos'):
            if filename.endswith('.mp3'):
                os.remove(os.path.join('Videos', filename))
                deleted += 1
        return jsonify({'status': 'success', 'message': f'Deleted {deleted} temp audio files.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/download_youtube', methods=['POST'])
def download_youtube():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'status': 'error', 'message': 'No URL provided.'})
    os.makedirs('Backgrounds', exist_ok=True)
    try:
        import subprocess
        subprocess.run([
            'yt-dlp',
            '-f', 'mp4',
            '-o', 'Backgrounds/%(title).40s.%(ext)s',
            url
        ], check=True)
        return jsonify({'status': 'success', 'message': 'Download completed successfully!'})
    except subprocess.CalledProcessError:
        return jsonify({'status': 'error', 'message': 'Failed to download the video.'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/backgrounds/<path:filename>')
def serve_background_file(filename):
    return send_from_directory('Backgrounds', filename)

if __name__ == '__main__':
    try:
        print(f"Starting server on port {port}")
        socketio.run(app, host='127.0.0.1', port=port, debug=True)
    except Exception as e:
        print(f"Error starting server: {e}")
        # Try to clean up any lingering processes
        try:
            import psutil
            for proc in psutil.process_iter(['pid', 'name']):
                if 'python' in proc.info['name'].lower():
                    proc.kill()
        except:
            pass 