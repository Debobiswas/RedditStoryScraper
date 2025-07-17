const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.post('/preview', (req, res) => {
  const { voiceType } = req.body;
  if (!voiceType) {
    return res.status(400).json({ error: 'voiceType is required' });
  }

  const pythonScript = path.join(__dirname, '..', '..', '..', 'video-processor', 'tts_preview.py');
  const tempDir = path.join(__dirname, '..', '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const outputPath = path.join(tempDir, `${uuidv4()}.mp3`);

  const pythonProcess = spawn('python', [pythonScript, '--voice-type', voiceType, '--output-path', outputPath]);

  let stderrData = '';
  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      res.sendFile(outputPath, (err) => {
        fs.unlink(outputPath, () => {});
        if (err) console.error('Error sending preview file:', err);
      });
    } else {
      console.error('TTS preview failed:', stderrData);
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });
});

module.exports = router;
