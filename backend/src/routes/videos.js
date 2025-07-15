const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

const videosDir = path.join(__dirname, '..', '..', 'output');

// Endpoint to list all generated videos
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(videosDir);
    
    const videoFiles = await Promise.all(
      files
        .filter(file => file.toLowerCase().endsWith('.mp4'))
        .map(async (file) => {
          const filePath = path.join(videosDir, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            url: `/output/${file}`,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
    );

    // Sort videos by creation date, newest first
    videoFiles.sort((a, b) => b.createdAt - a.createdAt);

    res.json(videoFiles);
  } catch (err) {
    // If the output directory doesn't exist, return an empty array
    if (err.code === 'ENOENT') {
      return res.json([]);
    }
    console.error('Failed to list generated videos:', err);
    res.status(500).json({ error: 'Failed to list generated videos' });
  }
});

module.exports = router; 