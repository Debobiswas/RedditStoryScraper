const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promises: fsPromises } = require('fs');

const router = express.Router();

// Use repo-level downloads directory mounted into the container
const backgroundVideosDir = path.join(__dirname, '..', '..', 'downloads');

// Ensure the directory for background videos exists
if (!fs.existsSync(backgroundVideosDir)) {
  fs.mkdirSync(backgroundVideosDir, { recursive: true });
}

// Endpoint to download a YouTube video
router.post('/download', (req, res) => {
  const { youtubeUrl, category } = req.body;
  if (!youtubeUrl || !category) {
    return res.status(400).json({ error: 'YouTube URL and category are required' });
  }

  // Basic security check for category name
  if (category.includes('..') || category.includes('/') || category.includes('\\')) {
    return res.status(400).json({ error: 'Invalid category name.' });
  }

  const categoryDir = path.join(backgroundVideosDir, category);

  // Ensure the category directory exists
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const pythonScript = path.join(__dirname, '..', '..', 'video-processor', 'download_from_url.py');

  try {
    const pythonProcess = spawn('python3', ['-u', pythonScript, '--url', youtubeUrl, '--output-dir', categoryDir]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[PYTHON STDOUT] ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[PYTHON STDERR] ${data}`);
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python download process:', err);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Download process exited with code ${code}`);
      } else {
        console.log('Background video download completed successfully');
      }
    });

    res.status(202).json({ message: 'Download started successfully! The video will appear in the list shortly.' });

  } catch (error) {
    console.error('Error spawning download process:', error);
    res.status(500).json({ error: 'Failed to start download process.' });
  }
});

// Endpoint to list downloaded videos
router.get('/', (req, res) => {
  fs.readdir(backgroundVideosDir, (err, files) => {
    if (err) {
      console.error('Failed to list background videos:', err);
      return res.status(500).json({ error: 'Failed to list background videos' });
    }
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    res.json(videoFiles);
  });
});

// Endpoint to delete a video
router.delete('/:filename', (req, res) => {
  const { filename } = req.params;

  // Basic security check to prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename.' });
  }

  const filePath = path.join(backgroundVideosDir, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete video ${filename}:`, err);
      return res.status(500).json({ error: 'Failed to delete video.' });
    }
    res.json({ message: `Successfully deleted ${filename}` });
  });
});

// Endpoint to list background categories (subdirectories)
router.get('/categories', async (req, res) => {
  try {
    const entries = await fsPromises.readdir(backgroundVideosDir, { withFileTypes: true });
    const categories = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    res.json(categories);
  } catch (err) {
    console.error('Failed to list background categories:', err);
    res.status(500).json({ error: 'Failed to list background categories' });
  }
});

module.exports = router; 