const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'jobs.db');

// Initialize database
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Create jobs table
      db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          reddit_url TEXT NOT NULL,
          num_posts INTEGER DEFAULT 5,
          video_length INTEGER DEFAULT 60,
          voice_type TEXT DEFAULT 'female',
          background_type TEXT DEFAULT 'minecraft',
          status TEXT DEFAULT 'pending',
          progress INTEGER DEFAULT 0,
          video_url TEXT,
          error TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating jobs table:', err);
          reject(err);
        } else {
          console.log('Jobs table ready');
          resolve();
        }
      });
    });
  });
}

// Create a new job
async function createJob(jobId, jobData) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, reddit_url, num_posts, video_length, 
        voice_type, background_type, status, progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      jobId,
      jobData.redditUrl,
      jobData.numPosts,
      jobData.videoLength,
      jobData.voiceType,
      jobData.backgroundType,
      jobData.status,
      jobData.progress
    ], function(err) {
      if (err) {
        console.error('Error creating job:', err);
        reject(err);
      } else {
        console.log(`Job created with ID: ${jobId}`);
        resolve({ id: jobId, ...jobData });
      }
    });
    
    stmt.finalize();
    db.close();
  });
}

// Update job status
async function updateJob(jobId, updates) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const fields = [];
    const values = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    if (updates.progress !== undefined) {
      fields.push('progress = ?');
      values.push(updates.progress);
    }
    
    if (updates.videoUrl !== undefined) {
      fields.push('video_url = ?');
      values.push(updates.videoUrl);
    }
    
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(jobId);
    
    const sql = `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error updating job:', err);
        reject(err);
      } else {
        console.log(`Job ${jobId} updated`);
        resolve();
      }
    });
    
    db.close();
  });
}

// Get job by ID
async function getJob(jobId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.get('SELECT * FROM jobs WHERE id = ?', [jobId], (err, row) => {
      if (err) {
        console.error('Error getting job:', err);
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        resolve({
          id: row.id,
          redditUrl: row.reddit_url,
          numPosts: row.num_posts,
          videoLength: row.video_length,
          voiceType: row.voice_type,
          backgroundType: row.background_type,
          status: row.status,
          progress: row.progress,
          videoUrl: row.video_url,
          error: row.error,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }
    });
    
    db.close();
  });
}

// Get all jobs (for admin/debugging)
async function getAllJobs() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.all('SELECT * FROM jobs ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        console.error('Error getting all jobs:', err);
        reject(err);
      } else {
        const jobs = rows.map(row => ({
          id: row.id,
          redditUrl: row.reddit_url,
          numPosts: row.num_posts,
          videoLength: row.video_length,
          voiceType: row.voice_type,
          backgroundType: row.background_type,
          status: row.status,
          progress: row.progress,
          videoUrl: row.video_url,
          error: row.error,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        resolve(jobs);
      }
    });
    
    db.close();
  });
}

// Clean up old jobs (older than 7 days)
async function cleanupOldJobs() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const sql = `DELETE FROM jobs WHERE created_at < datetime('now', '-7 days')`;
    
    db.run(sql, function(err) {
      if (err) {
        console.error('Error cleaning up old jobs:', err);
        reject(err);
      } else {
        console.log(`Cleaned up ${this.changes} old jobs`);
        resolve(this.changes);
      }
    });
    
    db.close();
  });
}

module.exports = {
  initializeDatabase,
  createJob,
  updateJob,
  getJob,
  getAllJobs,
  cleanupOldJobs
}; 