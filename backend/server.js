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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'GitGrade API is running',
    timestamp: new Date().toISOString()
  });
});

// Main analyze endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { repo_url } = req.body;
    
    // Validate input
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
    
    console.log(`🔍 Analyzing repository: ${repo_url}`);
    
    // Analyze the repository
    const result = await analyzer.analyzeRepository(repo_url);
    
    console.log(`✅ Analysis complete. Score: ${result.score}/100`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze repository'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 GitGrade API Starting...');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/health`);
  console.log('\n✨ Ready to analyze repositories!\n');
});