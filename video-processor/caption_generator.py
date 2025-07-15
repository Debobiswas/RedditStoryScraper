"""
Caption generator using OpenAI's Whisper for word-level timestamps
"""
import whisper
import os
from pathlib import Path
from typing import List, Dict, Union
from utils.logger import setup_logger

class CaptionGenerator:
    def __init__(self, model_name: str = "base.en"):
        self.logger = setup_logger('caption_generator')
        self.model_name = model_name
        self.model = None

    def _load_model(self):
        """Loads the Whisper model, downloading it if necessary."""
        if self.model is None:
            self.logger.info(f"Loading Whisper model: {self.model_name}...")
            # Specify a directory within the project to store downloaded models
            model_path = Path("temp/whisper_models")
            model_path.mkdir(parents=True, exist_ok=True)
            self.model = whisper.load_model(self.model_name, download_root=str(model_path))
            self.logger.info("Whisper model loaded successfully.")

    def generate_captions(self, audio_path: Union[str, Path], offset_time: float = 0.0) -> Dict:
        """
        Generates segment and word-level captions from an audio file.

        Args:
            audio_path: Path to the audio file.
            offset_time: A duration in seconds to add to all word timestamps.

        Returns:
            The raw result dictionary from Whisper, with timestamps potentially offset.
        """
        self._load_model()
        
        self.logger.info(f"Transcribing audio file: {audio_path}")
        try:
            # Use fp16=False for better CPU compatibility
            result = self.model.transcribe(str(audio_path), word_timestamps=True, fp16=False)
            
            # If an offset is provided, add it to all word timings
            if offset_time > 0:
                self.logger.info(f"Offsetting all caption timestamps by {offset_time:.2f} seconds.")
                for segment in result.get('segments', []):
                    for word in segment.get('words', []):
                        word['start'] += offset_time
                        word['end'] += offset_time
            
            self.logger.info(f"Successfully transcribed audio and generated captions.")
            return result

        except Exception as e:
            self.logger.error(f"Error during transcription: {e}")
            raise 