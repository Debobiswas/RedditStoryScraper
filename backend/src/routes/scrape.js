const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Scrape Reddit posts
router.post('/', (req, res) => {
  const { redditUrl, numPosts, sortBy } = req.body;

  if (!redditUrl) {
    return res.status(400).json({ error: 'Reddit URL is required' });
  }

  const pythonScript = path.join(__dirname, '..', '..', '..', 'video-processor', 'reddit_scraper.py');
  
  const scriptArgs = [
    pythonScript,
    '--url', redditUrl,
    '--num-posts', numPosts || 10,
    '--sort-by', sortBy || 'hot'
  ];

  const pythonProcess = spawn('python', scriptArgs);

  let resultData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    resultData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Scraping script exited with code ${code}`);
      console.error(errorData);
      return res.status(500).json({ error: 'Failed to scrape Reddit posts.', details: errorData });
    }

    try {
      const posts = JSON.parse(resultData);
      res.json({
        success: true,
        posts: posts,
        message: `Successfully scraped ${posts.length} posts`
      });
    } catch (e) {
      console.error('Failed to parse JSON from scraping script:', e);
      console.error('Raw data from script:', resultData);
      return res.status(500).json({ error: 'Failed to parse data from scraper.', details: resultData });
    }
  });
});

module.exports = router; 