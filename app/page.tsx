'use client'

import { useState } from 'react'

interface VideoIdea {
  title: string
  thumbDesign: string
  videoIdea: string
}

interface AnalysisResult {
  videos: Array<{
    title: string
    videoId: string
  }>
  topics: string[]
  news: Array<{
    title: string
    url: string
    source: string
  }>
  redditPosts: Array<{
    title: string
    url: string
    subreddit: string
    score: number
  }>
  ideas: VideoIdea[]
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
        throw new Error('Please enter a valid YouTube channel URL')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channelUrl: url }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
          throw new Error(errorData.error || `Failed to analyze channel (${response.status})`)
        }

        const data = await response.json()
        
        if (!data.videos || !Array.isArray(data.videos)) {
          throw new Error('Invalid response format from server')
        }

        setResult(data)
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Please try again with a different channel.')
        }
        throw err
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '3rem',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            TubeAI
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '1.1rem',
            fontWeight: '400'
          }}>
            Generate content ideas for your YouTube channel using AI
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube channel URL (e.g., https://www.youtube.com/@channelname)"
              required
              disabled={loading}
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Analyzing...' : 'Generate Ideas'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing channel, fetching news, and searching Reddit...</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
              This may take 30-60 seconds
            </p>
          </div>
        )}

        {result && (
          <div className="results">
            <h2 className="section-title">Recent Videos</h2>
            <div className="videos-list">
              {result.videos.map((video, idx) => (
                <div key={idx} className="video-item">
                  {video.title}
                </div>
              ))}
            </div>

            <h2 className="section-title">Identified Topics</h2>
            <div className="topics-container">
              {result.topics.map((topic, idx) => (
                <span key={idx} className="topic-badge">
                  {topic}
                </span>
              ))}
            </div>

            {result.news.length > 0 && (
              <>
                <h2 className="section-title">Relevant News</h2>
                <div className="videos-list">
                  {result.news.slice(0, 5).map((article, idx) => (
                    <div key={idx} className="video-item">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {article.title}
                      </a>
                      <span>
                        {article.source}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result.redditPosts.length > 0 && (
              <>
                <h2 className="section-title">Reddit Discussions</h2>
                <div className="videos-list">
                  {result.redditPosts.slice(0, 5).map((post, idx) => (
                    <div key={idx} className="video-item">
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {post.title}
                      </a>
                      <span>
                        r/{post.subreddit} • {post.score} upvotes
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="section-title">Generated Video Ideas</h2>
            {result.ideas.map((idea, idx) => (
              <div key={idx} className="video-idea">
                <h3>{idea.title}</h3>
                <div className="thumb-design">
                  <strong>Thumb Design:</strong> {idea.thumbDesign}
                </div>
                <p><strong>Video Idea:</strong> {idea.videoIdea}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

