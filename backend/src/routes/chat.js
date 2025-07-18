const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// Proxy endpoint to chat with OpenRouter AI
router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key missing. Set OPENROUTER_API_KEY in your environment.' });
  }
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/auto',
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ error: 'Failed to fetch completion' });
  }
});

module.exports = router;
