require('dotenv').config();
const express = require('express');
const cors = require('cors');
const RepoAnalyzer = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize analyzer
const analyzer = new RepoAnalyzer();

// ✅ ROOT ROUTE (IMPORTANT FIX)
app.get('/', (req, res) => {
  res.send('🚀 GitGrade Backend is running');
});

// ✅ HEALTH ROUTE
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'GitGrade API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ ANALYZE ROUTE
app.post('/api/analyze', async (req, res) => {
  try {
    const { repo_url } = req.body;

    if (!repo_url) {
      return res.status(400).json({
        success: false,
        error: 'Repository URL is required'
      });
    }

    if (!repo_url.includes('github.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub URL'
      });
    }

    console.log("🔍 START ANALYSIS:", repo_url);

    const result = await analyzer.analyzeRepository(repo_url);

    console.log("✅ SUCCESS:", result.score);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze repository'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});