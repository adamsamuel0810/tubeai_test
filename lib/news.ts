import axios from 'axios'
import { NewsArticle } from './types'

const NEWS_API_KEY = process.env.NEWS_API_KEY
const NEWS_API_BASE = 'https://newsapi.org/v2'

export async function fetchRelevantNews(topics: string[]): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set, skipping news fetch')
    return []
  }

  try {
    const query = topics.slice(0, 3).join(' OR ')
    const today = new Date().toISOString().split('T')[0]

    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
        from: today,
        apiKey: NEWS_API_KEY,
      },
    })

    if (response.data.articles) {
      return response.data.articles
        .filter((article: any) => article.title && article.url)
        .map((article: any) => ({
          title: article.title,
          url: article.url,
          source: article.source?.name || 'Unknown',
          publishedAt: article.publishedAt,
        }))
    }

    return []
  } catch (error: any) {
    console.error('Error fetching news:', error.message)
    return []
  }
}

