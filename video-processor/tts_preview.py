import argparse
from pathlib import Path
from text_to_speech import TextToSpeechGenerator


def main():
    parser = argparse.ArgumentParser(description="Generate a short TTS preview")
    parser.add_argument("--voice-type", default="female", help="Voice type key")
    parser.add_argument("--output-path", required=True, help="Where to save mp3")
    args = parser.parse_args()

    generator = TextToSpeechGenerator(voice_type=args.voice_type)
    sample_text = "This is a sample of my voice."
    generator.generate_speech(sample_text, Path(args.output_path))


if __name__ == "__main__":
    main()
