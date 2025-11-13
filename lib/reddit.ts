import axios from 'axios'
import { RedditPost } from './types'

export async function searchReddit(topics: string[]): Promise<RedditPost[]> {
  try {
    const allPosts: RedditPost[] = []
    
    for (const topic of topics.slice(0, 3)) {
      try {
        const searchQuery = topic.replace(/\s+/g, '+')
        const response = await axios.get(
          `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=hot&limit=5&t=week`,
          {
            headers: {
              'User-Agent': 'TubeAI/1.0',
            },
          }
        )

        if (response.data?.data?.children) {
          const posts = response.data.data.children
            .filter((child: any) => child.data && !child.data.stickied)
            .map((child: any) => ({
              title: child.data.title,
              url: `https://reddit.com${child.data.permalink}`,
              subreddit: child.data.subreddit,
              score: child.data.score || 0,
              created: child.data.created_utc,
            }))
          
          allPosts.push(...posts)
        }
      } catch (error) {
        console.error(`Error searching Reddit for topic "${topic}":`, error)
      }
    }

    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.url, post])).values()
    )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return uniquePosts
  } catch (error) {
    console.error('Error searching Reddit:', error)
    return []
  }
}

