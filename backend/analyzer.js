const { Octokit } = require('@octokit/rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class RepoAnalyzer {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined
    });
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Extract owner and repo from GitHub URL
  parseRepoUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }

  // Main analysis function
  async analyzeRepository(repoUrl) {
    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      
      // Fetch all metrics
      const metrics = await this.fetchMetrics(owner, repo);
      
      // Calculate score
      const score = this.calculateScore(metrics);
      
      // Generate AI insights
      const { summary, roadmap } = await this.generateAIInsights(metrics, score);
      
      return {
        score,
        summary,
        roadmap,
        metrics
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  // Fetch repository metrics
  async fetchMetrics(owner, repo) {
    const metrics = {};

    try {
      // Get repository info
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      
      metrics.name = repoData.name;
      metrics.stars = repoData.stargazers_count;
      metrics.forks = repoData.forks_count;
      metrics.watchers = repoData.watchers_count;
      metrics.open_issues = repoData.open_issues_count;
      metrics.primary_language = repoData.language || 'Unknown';
      
      // Get languages
      const { data: languages } = await this.octokit.repos.listLanguages({ owner, repo });
      metrics.languages = Object.keys(languages);
      
      // Check for README
      try {
        const { data: readme } = await this.octokit.repos.getReadme({ owner, repo });
        metrics.has_readme = true;
        metrics.readme_length = Buffer.from(readme.content, 'base64').length;
      } catch {
        metrics.has_readme = false;
        metrics.readme_length = 0;
      }
      
      // Get commits (limited to last 100)
      const { data: commits } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 100
      });
      metrics.total_commits = commits.length;
      
      // Count recent commits (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      metrics.recent_commits = commits.filter(commit => 
        new Date(commit.commit.author.date) > threeMonthsAgo
      ).length;
      
      // Get branches
      const { data: branches } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });
      metrics.branch_count = branches.length;
      
      // Get pull requests
      try {
        const { data: prs } = await this.octokit.pulls.list({
          owner,
          repo,
          state: 'all',
          per_page: 100
        });
        metrics.total_prs = prs.length;
      } catch {
        metrics.total_prs = 0;
      }
      
      // Check for tests
      metrics.has_tests = await this.checkForTests(owner, repo);
      
      // Check for CI/CD
      metrics.has_cicd = await this.checkForCICD(owner, repo);
      
      return metrics;
      
    } catch (error) {
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }
  }

  // Check if repository has tests
  async checkForTests(owner, repo) {
    const testIndicators = ['test', 'tests', '__tests__', 'spec', 'specs'];
    
    try {
      const { data: contents } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ''
      });
      
      return contents.some(item => 
        testIndicators.some(indicator => 
          item.name.toLowerCase().includes(indicator)
        )
      );
    } catch {
      return false;
    }
  }

  // Check for CI/CD setup
  async checkForCICD(owner, repo) {
    const cicdPaths = [
      '.github/workflows',
      '.gitlab-ci.yml',
      '.travis.yml',
      'Jenkinsfile',
      '.circleci/config.yml'
    ];
    
    for (const path of cicdPaths) {
      try {
        await this.octokit.repos.getContent({ owner, repo, path });
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  }

  // Calculate repository score (0-100)
  calculateScore(metrics) {
    let score = 0;
    
    // README (20 points)
    if (metrics.has_readme) {
      if (metrics.readme_length > 1000) {
        score += 20;
      } else if (metrics.readme_length > 500) {
        score += 15;
      } else {
        score += 10;
      }
    }
    
    // Commits (25 points)
    if (metrics.total_commits >= 100) {
      score += 25;
    } else if (metrics.total_commits >= 50) {
      score += 20;
    } else if (metrics.total_commits >= 20) {
      score += 15;
    } else {
      score += Math.max(5, Math.floor(metrics.total_commits / 2));
    }
    
    // Recent activity (15 points)
    if (metrics.recent_commits > 20) {
      score += 15;
    } else if (metrics.recent_commits > 10) {
      score += 10;
    } else if (metrics.recent_commits > 0) {
      score += 5;
    }
    
    // Tests (20 points)
    if (metrics.has_tests) {
      score += 20;
    }
    
    // CI/CD (10 points)
    if (metrics.has_cicd) {
      score += 10;
    }
    
    // Branches (5 points)
    if (metrics.branch_count > 3) {
      score += 5;
    } else if (metrics.branch_count > 1) {
      score += 3;
    }
    
    // Pull Requests (5 points)
    if (metrics.total_prs > 10) {
      score += 5;
    } else if (metrics.total_prs > 0) {
      score += 3;
    }
    
    return Math.min(100, score);
  }

  // Generate AI-powered summary and roadmap using Gemini
  async generateAIInsights(metrics, score) {
    const prompt = `You are an expert code reviewer analyzing a GitHub repository. Based on these metrics, provide honest feedback.

Repository Metrics:
- Name: ${metrics.name}
- Primary Language: ${metrics.primary_language}
- Total Commits: ${metrics.total_commits}
- Recent Commits (3 months): ${metrics.recent_commits}
- Has README: ${metrics.has_readme}
- README Length: ${metrics.readme_length} characters
- Has Tests: ${metrics.has_tests}
- Has CI/CD: ${metrics.has_cicd}
- Branches: ${metrics.branch_count}
- Open Issues: ${metrics.open_issues}
- Pull Requests: ${metrics.total_prs}
- Stars: ${metrics.stars}
- Languages: ${metrics.languages.slice(0, 3).join(', ')}

Calculated Score: ${score}/100

Please provide:
1. A 2-3 sentence summary of the repository's strengths and weaknesses
2. A personalized roadmap with 4-6 specific, actionable improvement items

Format your response EXACTLY as:
SUMMARY: [your summary]
ROADMAP:
- [item 1]
- [item 2]
- [item 3]
etc.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse response
      const parts = responseText.split('ROADMAP:');
      const summary = parts[0].replace('SUMMARY:', '').trim();
      const roadmapText = parts[1] ? parts[1].trim() : '';
      
      // Extract roadmap items
      const roadmap = roadmapText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(item => item.length > 0);
      
      return { summary, roadmap };
      
    } catch (error) {
      console.error('AI generation failed:', error.message);
      
      // Fallback if AI fails
      const summary = score > 70 
        ? `Repository demonstrates strong development practices with ${metrics.total_commits} commits and ${metrics.has_tests ? 'testing' : 'active development'}.`
        : score > 40 
        ? `Repository shows moderate development practices. ${metrics.has_readme ? 'Has documentation' : 'Needs documentation'} and ${metrics.has_tests ? 'includes tests' : 'lacks tests'}.`
        : `Repository is in early stages. Focus on establishing ${!metrics.has_readme ? 'documentation, ' : ''}${!metrics.has_tests ? 'testing, ' : ''}and consistent development practices.`;
      
      const roadmap = [
        !metrics.has_readme ? 'Add comprehensive README with setup instructions and project overview' : 'Expand README with usage examples and contribution guidelines',
        !metrics.has_tests ? 'Implement unit tests for core functionality' : 'Increase test coverage to 80%+',
        !metrics.has_cicd ? 'Set up CI/CD pipeline using GitHub Actions' : 'Enhance CI/CD with automated deployments',
        metrics.recent_commits < 10 ? 'Establish regular commit schedule (weekly minimum)' : 'Maintain consistent commit patterns',
        metrics.branch_count <= 1 ? 'Adopt feature branch workflow (main + feature branches)' : 'Continue effective branch management',
        'Add code documentation and inline comments for complex logic'
      ];
      
      return { summary, roadmap };
    }
  }
}

module.exports = RepoAnalyzer;