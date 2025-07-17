"""
Text-to-speech generator for narration using Microsoft Edge's TTS service.
"""

import asyncio
from pathlib import Path
from typing import Union
import edge_tts
from utils.logger import setup_logger

class TextToSpeechGenerator:
    def __init__(self, voice_type: str = 'female'):
        self.logger = setup_logger('text_to_speech')
        
        # Voice and rate configuration using edge-tts voices
        self.voice_config = {
            'female': {
                'voice': 'en-US-AriaNeural',
                'rate': '+20%'
            },
            'male': {
                'voice': 'en-US-GuyNeural',
                'rate': 'default'
            },
            'jenny': {
                'voice': 'en-US-JennyNeural',
                'rate': 'default'
            },
            'davis': {
                'voice': 'en-US-DavisNeural',
                'rate': '-10%'
            }
        }
        
        # Set the selected voice and rate
        config = self.voice_config.get(voice_type, self.voice_config['female'])
        self.voice = config['voice']
        self.rate = config['rate']

    async def _generate_speech_async(self, text: str, output_path: Union[str, Path]):
        """Asynchronous method to generate and save speech."""
        self.logger.info(f"Generating speech with voice '{self.voice}' at rate '{self.rate}'")
        communicate = edge_tts.Communicate(text, self.voice, rate=self.rate)
        await communicate.save(str(output_path))

    def generate_speech(self, text: str, output_path: Union[str, Path]) -> Path:
        """
        Generate speech from text using edge-tts. This is a synchronous wrapper.
        
        Args:
            text: Text to convert to speech
            output_path: Path to save the audio file (should be .mp3)
            
        Returns:
            Path to generated audio file
        """
        try:
            # edge-tts is async, so we run it in an event loop
            asyncio.run(self._generate_speech_async(text, output_path))
            
            self.logger.info(f'Generated speech: {output_path}')
            return Path(output_path)
            
        except Exception as e:
            self.logger.error(f'Error generating speech: {str(e)}')
            raise

    def validate_text(self, text: str) -> bool:
        """
        Validate text for TTS generation.
        
        Args:
            text: Text to validate
            
        Returns:
            True if text is valid for TTS
        """
        if not text or len(text.strip()) == 0:
            return False
        
        if len(text) > 5000:
            self.logger.warning("Text may be too long for TTS generation.")
        
        return True 