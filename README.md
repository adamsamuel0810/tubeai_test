# TubeAI - YouTube Content Idea Generator

A Next.js application that analyzes YouTube channels and generates content ideas based on:
- Recent channel videos
- Current news trends
- Reddit discussions
- AI-powered topic analysis

## Features

- **YouTube Channel Analysis**: Fetches the last 10 videos from any YouTube channel
- **Topic Extraction**: Uses GPT-4 to understand what topics the channel covers
- **News Integration**: Fetches relevant news articles from today
- **Reddit Research**: Searches Reddit for recent discussions on channel topics
- **AI-Powered Ideas**: Generates 5 video ideas with titles, thumbnail designs, and concepts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with the following variables:
```
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key
NEWS_API_KEY=your_newsapi_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

### Required
- `YOUTUBE_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/)
  - Enable YouTube Data API v3
  - Create credentials (API Key)
- `OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com/)
  - Requires GPT-4 access (gpt-4-turbo-preview)

### Optional
- `NEWS_API_KEY`: Get from [NewsAPI](https://newsapi.org/) (free tier available)
  - If not provided, news fetching will be skipped

## Deployment to Vercel

1. Push your code to GitHub

2. Import the project in [Vercel](https://vercel.com):
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import your GitHub repository

3. Add environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add all required variables:
     - `YOUTUBE_API_KEY`
     - `OPENAI_API_KEY`
     - `NEWS_API_KEY` (optional)

4. Deploy:
   - Vercel will automatically deploy on push to main branch
   - Or click "Deploy" in the dashboard

## Architecture

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 Turbo for topic analysis and idea generation
- **APIs**:
  - YouTube Data API v3
  - NewsAPI (optional)
  - Reddit JSON API (public, no auth required)

## Usage

1. Enter a YouTube channel URL (supports various formats):
   - `https://www.youtube.com/@channelname`
   - `https://www.youtube.com/channel/CHANNEL_ID`
   - `https://www.youtube.com/c/channelname`
   - `https://www.youtube.com/user/username`

2. Click "Generate Ideas"

3. Wait for analysis (30-60 seconds)

4. View results:
   - Recent videos from the channel
   - Identified topics
   - Relevant news articles
   - Reddit discussions
   - 5 generated video ideas with titles, thumbnail designs, and concepts

## Notes

- The app uses GPT-4 Turbo for accurate topic analysis and idea generation
- News fetching requires a NewsAPI key (free tier available)
- Reddit search uses the public JSON API (no authentication required)
- All API calls are made server-side for security

