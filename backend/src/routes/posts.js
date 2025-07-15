const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const router = express.Router();

// In-memory storage for posts (in production, use a real database)
let savedPosts = [];

// Save posts to storage
router.post('/save', async (req, res) => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'Posts array is required' });
    }

    // Add timestamps and ensure unique IDs
    const postsWithMetadata = posts.map(post => ({
      ...post,
      id: post.id || uuidv4(),
      saved_at: new Date().toISOString()
    }));

    // Add to saved posts (avoid duplicates)
    postsWithMetadata.forEach(newPost => {
      const existingIndex = savedPosts.findIndex(p => p.id === newPost.id);
      if (existingIndex >= 0) {
        savedPosts[existingIndex] = newPost;
      } else {
        savedPosts.push(newPost);
      }
    });

    res.json({ 
      success: true,
      message: `Saved ${postsWithMetadata.length} posts`,
      count: savedPosts.length
    });

  } catch (error) {
    console.error('Error saving posts:', error);
    res.status(500).json({ error: 'Failed to save posts' });
  }
});

// Get all saved posts
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true,
      posts: savedPosts.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at))
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Export posts to Excel
router.post('/export', async (req, res) => {
  try {
    const { posts } = req.body;
    const postsToExport = posts || savedPosts;

    if (!postsToExport || postsToExport.length === 0) {
      return res.status(400).json({ error: 'No posts to export' });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reddit Posts');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Text', key: 'text', width: 100 },
      { header: 'Subreddit', key: 'subreddit', width: 20 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'URL', key: 'url', width: 50 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Saved At', key: 'saved_at', width: 20 }
    ];

    // Add data
    postsToExport.forEach(post => {
      worksheet.addRow({
        id: post.id,
        title: post.title,
        text: post.text,
        subreddit: post.subreddit,
        score: post.score,
        url: post.url,
        created_at: post.created_at,
        saved_at: post.saved_at || new Date().toISOString()
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reddit_posts_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting posts:', error);
    res.status(500).json({ error: 'Failed to export posts' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = savedPosts.length;
    
    savedPosts = savedPosts.filter(post => post.id !== id);
    
    if (savedPosts.length < initialLength) {
      res.json({ success: true, message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Clear all posts
router.delete('/', async (req, res) => {
  try {
    const deletedCount = savedPosts.length;
    savedPosts = [];
    res.json({ 
      success: true, 
      message: `Deleted ${deletedCount} posts`,
      count: 0
    });
  } catch (error) {
    console.error('Error clearing posts:', error);
    res.status(500).json({ error: 'Failed to clear posts' });
  }
});

module.exports = router; 