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

  // Timeout wrapper
  async withTimeout(promise, ms = 8000) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), ms)
      )
    ]);
  }

  parseRepoUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');

    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }

  async analyzeRepository(repoUrl) {
    console.log("STEP 1: Parse URL");
    const { owner, repo } = this.parseRepoUrl(repoUrl);

    console.log("STEP 2: Fetch metrics");
    const metrics = await this.fetchMetrics(owner, repo);

    console.log("STEP 3: Calculate score");
    const score = this.calculateScore(metrics);

    console.log("STEP 4: AI Insights");

    let summary = "";
    let roadmap = [];

    try {
      const ai = await this.withTimeout(
        this.generateAIInsights(metrics, score),
        10000
      );
      summary = ai.summary;
      roadmap = ai.roadmap;
    } catch (err) {
      console.log("⚠️ AI FAILED:", err.message);

      const fallback = this.getFallbackInsights(metrics, score);
      summary = fallback.summary;
      roadmap = fallback.roadmap;
    }

    return { score, summary, roadmap, metrics };
  }

  async fetchMetrics(owner, repo) {
    try {
      const { data: repoData } = await this.withTimeout(
        this.octokit.repos.get({ owner, repo })
      );

      const metrics = {
        name: repoData.name,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        open_issues: repoData.open_issues_count,
        primary_language: repoData.language || 'Unknown'
      };

      const { data: commits } = await this.withTimeout(
        this.octokit.repos.listCommits({ owner, repo, per_page: 100 })
      );

      metrics.total_commits = commits.length;

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      metrics.recent_commits = commits.filter(commit =>
        new Date(commit.commit.author.date) > threeMonthsAgo
      ).length;

      metrics.has_tests = false;
      metrics.has_cicd = false;
      metrics.branch_count = 1;
      metrics.total_prs = 0;

      return metrics;

    } catch (error) {
      throw new Error(`GitHub fetch failed: ${error.message}`);
    }
  }

  calculateScore(metrics) {
    let score = 0;

    if (metrics.total_commits > 50) score += 25;
    else if (metrics.total_commits > 20) score += 15;
    else score += 5;

    if (metrics.recent_commits > 10) score += 15;
    else if (metrics.recent_commits > 0) score += 5;

    if (metrics.has_tests) score += 20;
    if (metrics.has_cicd) score += 10;

    return Math.min(100, score);
  }

  async generateAIInsights(metrics, score) {
    const prompt = `Analyze repo with score ${score}. Give summary + roadmap.`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    return {
      summary: text.slice(0, 150),
      roadmap: ["Improve docs", "Add tests", "Improve commits"]
    };
  }

  getFallbackInsights(metrics, score) {
    return {
      summary: `Basic analysis: repo has ${metrics.total_commits} commits.`,
      roadmap: [
        "Add README",
        "Write tests",
        "Improve commit frequency",
        "Add CI/CD"
      ]
    };
  }
}

module.exports = RepoAnalyzer;