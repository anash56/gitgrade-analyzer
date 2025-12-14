# 🎯 GitGrade - AI Repository Analyzer

An intelligent system that evaluates GitHub repositories and provides meaningful scores, summaries, and personalized roadmaps for developers.

## 🌟 Features

- **Automated Repository Analysis**: Fetches and analyzes public GitHub repositories
- **Comprehensive Scoring**: 0-100 score based on multiple quality dimensions
- **AI-Powered Insights**: Uses GEMINI to generate personalized summaries
- **Actionable Roadmap**: Step-by-step improvement recommendations
- **Real-time Metrics**: Displays commit history, test coverage, CI/CD status, and more

## 🏗️ Architecture

### Backend (Node.js + Express)
- Fetches repository data using GitHub REST API (@octokit/rest)
- Analyzes code quality, structure, documentation, and practices
- Generates AI-powered insights using GEMINI
- Calculates weighted scores across multiple dimensions

### Frontend (HTML/JavaScript)
- Clean, responsive interface built with Tailwind CSS
- Real-time analysis feedback
- Visual score presentation with color coding
- Detailed metrics display

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- GEMINI API Key ([Get one here]( https://makersuite.google.com/app/apikey))
- GitHub Token (Optional, for higher rate limits)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/gitgrade-analyzer.git
cd gitgrade-analyzer
```

2. **Set up Backend**
```bash
cd backend
npm install
```

3. **Configure Environment Variables**

Create a `.env` file in the `backend` folder:
```
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here  # Optional
PORT=5000
```

4. **Run the Backend**
```bash
npm start
```
Backend will run on `http://localhost:5000`

5. **Open Frontend**
```bash
cd ../frontend
# Open index.html directly in your browser

# use Node.js:
npx http-server -p 8000
```
Frontend will be available at `http://localhost:8000`

## 📊 How It Works

### Analysis Dimensions

1. **Documentation (20 points)**
   - README presence and quality
   - Length and comprehensiveness

2. **Commit History (25 points)**
   - Total commits
   - Recent activity (last 3 months)
   - Consistency

3. **Code Quality (20 points)**
   - Test presence
   - Test coverage indicators

4. **Development Practices (20 points)**
   - CI/CD setup
   - Branch usage
   - Pull request patterns

5. **Community & Engagement (15 points)**
   - Stars, forks, watchers
   - Issue tracking
   - Active maintenance

### Score Interpretation
- **90-100**: Excellent - Production-ready project
- **70-89**: Good - Strong foundation with minor improvements needed
- **50-69**: Average - Requires significant improvements
- **0-49**: Needs Work - Basic structure needs enhancement

## 🎥 Demo

[https://drive.google.com/file/d/1XVd2JocSrKj4RYJKZ-HONMD1cmCEXByt/view?usp=drive_link]

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Octokit
- **AI**: GOOGLE GEMINI
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **APIs**: GitHub REST API, GEMINI API

## 📝 Example Output

**Input**: `https://github.com/facebook/react`

**Output**:
```
Score: 95/100

Summary: Exceptional open-source project with comprehensive documentation, 
extensive test coverage, and active community engagement. Strong CI/CD 
practices and consistent maintenance.

Roadmap:
1. Continue maintaining excellent documentation standards
2. Keep expanding test coverage for new features
3. Maintain active community engagement
4. Continue using advanced Git workflows
```

## 🤝 Contributing

This project was built for the GitGrade Hackathon. Feedback and suggestions are welcome!

## 📄 License

MIT License

## 👨‍💻 Author

Built with ❤️ for GitGrade Hackathon

---

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
- Ensure all dependencies are installed: `npm install`
- Check if port 5000 is available
- Verify your `.env` file has valid API keys

**Missing dependencies:**
```bash
npm install express cors dotenv @octokit/rest @anthropic-ai/sdk axios
```

**API Rate Limits:**
- Add a GitHub token to `.env` for higher rate limits
- GitHub allows 60 requests/hour without auth, 5000 with auth

**CORS Errors:**
- Make sure CORS is enabled in server.js
- Backend must be running before accessing frontend

---

## 📦 Project Structure

```
gitgrade-analyzer/
├── backend/
│   ├── server.js          # Express server
│   ├── analyzer.js        # Core analysis logic
│   ├── package.json       # Dependencies
│   └── .env              # Environment variables (don't commit!)
├── frontend/
│   └── index.html        # Single-page application
├── .gitignore
└── README.md
```

---

**Last Updated**: December 2025