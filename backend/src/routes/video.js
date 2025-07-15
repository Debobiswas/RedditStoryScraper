const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createJob, updateJob, getJob } = require('../utils/database');

const router = express.Router();

// Generate video from Reddit posts
router.post('/generate', async (req, res) => {
  try {
    const { redditUrl, numPosts, videoLength, voiceType, backgroundType } = req.body;

    // Validate input
    if (!redditUrl) {
      return res.status(400).json({ error: 'Reddit URL is required' });
    }

    // Create job
    const jobId = uuidv4();
    await createJob(jobId, {
      redditUrl,
      numPosts: numPosts || 5,
      videoLength: videoLength || 60,
      voiceType: voiceType || 'female',
      backgroundType: backgroundType || 'minecraft',
      status: 'pending',
      progress: 0
    });

    // Start video generation in background
    generateVideoAsync(jobId, {
      redditUrl,
      numPosts,
      videoLength,
      voiceType,
      backgroundType
    });

    res.json({ 
      id: jobId, 
      status: 'pending',
      progress: 0,
      message: 'Video generation started'
    });

  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Get job status
router.get('/job/:id', async (req, res) => {
  try {
    const job = await getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Async video generation function
async function generateVideoAsync(jobId, config) {
  try {
    await updateJob(jobId, { status: 'processing', progress: 10 });

    const pythonScript = path.join(__dirname, '..', '..', '..', 'video-processor', 'generate_video.py');
    const outputDir = path.join(__dirname, '..', '..', '..', 'output'); // Changed path
    const outputPath = path.join(outputDir, `${jobId}.mp4`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Spawn Python process
    const pythonProcess = spawn('python', [
      pythonScript,
      '--job-id', jobId,
      '--reddit-url', config.redditUrl,
      '--num-posts', config.numPosts.toString(),
      '--video-length', config.videoLength.toString(),
      '--voice-type', config.voiceType,
      '--background-type', config.backgroundType,
      '--output-path', outputPath
    ]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      // Parse progress updates from stdout
      const lines = stdoutData.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          const progress = parseInt(line.split(':')[1]);
          updateJob(jobId, { progress });
        }
      }
      // Keep last line fragment
      stdoutData = lines.pop(); 
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        console.log(`Video generation for job ${jobId} successful.`);
        await updateJob(jobId, { 
          status: 'completed', 
          progress: 100,
          videoUrl: `/output/${jobId}.mp4`
        });
      } else {
        console.error(`Python script for job ${jobId} exited with code ${code}`);
        console.error('--- STDOUT ---');
        console.error(stdoutData);
        console.error('--- STDERR ---');
        console.error(stderrData);
        await updateJob(jobId, { 
          status: 'failed', 
          error: `Video generation failed. STDERR: ${stderrData}` 
        });
      }
    });

  } catch (error) {
    console.error('Error in video generation:', error);
    await updateJob(jobId, { 
      status: 'failed', 
      error: error.message 
    });
  }
}

// Generate video from custom text
router.post('/generate-from-text', async (req, res) => {
  try {
    const { title, text, backgroundType, voiceType } = req.body;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Truncate text for video generation to keep it a reasonable length
    const maxChars = 2000;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;

    // Create job
    const jobId = uuidv4();
    await createJob(jobId, {
      redditUrl: 'custom-text',
      numPosts: 1,
      voiceType: voiceType || 'female',
      backgroundType: backgroundType || 'minecraft',
      status: 'pending',
      progress: 0
    });

    // Start video generation in background
    generateVideoFromText(jobId, {
      title,
      text: truncatedText,
      backgroundType,
      voiceType
    });

    res.json({ 
      id: jobId, 
      status: 'pending',
      progress: 0,
      message: 'Video generation started'
    });

  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Async video generation function for custom text
async function generateVideoFromText(jobId, config) {
  try {
    await updateJob(jobId, { status: 'processing', progress: 10 });

    // --- Create a sanitized filename from the title ---
    const title = config.title || 'Untitled';
    const slug = title.toLowerCase()
      .replace(/[^\\w\\s-]/g, '') // Remove non-word chars except spaces and dashes
      .trim()
      .split(/\\s+/).slice(0, 5).join('-') // First 5 words, dash-separated
      .replace(/--+/g, '-'); // Remove duplicate dashes
    const shortId = jobId.split('-')[0];
    const newFilename = `${slug}-${shortId}.mp4`;
    // ---

    const pythonScript = path.join(__dirname, '..', '..', '..', 'video-processor', 'generate_video_from_text.py');
    const outputDir = path.join(__dirname, '..', '..', '..', 'output');
    const outputPath = path.join(outputDir, newFilename); // Use the new filename

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Combine title and text for the script
    const fullTextForScript = `${config.title}\\n\\n${config.text}`;

    // Create temporary text file
    const tempTextFile = path.join(outputDir, `${jobId}_text.txt`);
    fs.writeFileSync(tempTextFile, fullTextForScript);

    // Spawn Python process
    const pythonProcess = spawn('python', [
      pythonScript,
      '--job-id', jobId,
      '--text-file', tempTextFile,
      '--voice-type', config.voiceType,
      '--background-type', config.backgroundType,
      '--output-path', outputPath
    ]);

    let stdoutData = '';
    let stderrData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[PYTHON STDOUT] ${output}`); // Log in real-time
      stdoutData += output;
      // Parse progress updates
      const lines = stdoutData.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          const progress = parseInt(line.split(':')[1]);
          updateJob(jobId, { progress });
        }
      }
      // Keep last line fragment
      stdoutData = lines.pop();
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[PYTHON STDERR] ${output}`); // Log in real-time
      stderrData += output;
    });

    pythonProcess.on('close', async (code) => {
      // Clean up temporary file
      if (fs.existsSync(tempTextFile)) {
        fs.unlinkSync(tempTextFile);
      }

      if (code === 0) {
        console.log(`Video generation from text for job ${jobId} successful.`);
        await updateJob(jobId, { 
          status: 'completed', 
          progress: 100,
          videoUrl: `/output/${newFilename}` // Use new filename
        });
      } else {
        console.error(`Python script for job ${jobId} exited with code ${code}`);
        console.error('--- STDOUT ---');
        console.error(stdoutData);
        console.error('--- STDERR ---');
        console.error(stderrData);
        await updateJob(jobId, { 
          status: 'failed', 
          error: `Video generation failed. STDERR: ${stderrData}`
        });
      }
    });

  } catch (error) {
    console.error('Error in video generation:', error);
    await updateJob(jobId, { 
      status: 'failed', 
      error: error.message 
    });
  }
}

module.exports = router; 