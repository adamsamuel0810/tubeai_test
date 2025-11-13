export interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
}

export interface ChannelInfo {
  id: string
  title: string
  description: string
}

export interface NewsArticle {
  title: string
  url: string
  source: string
  publishedAt: string
}

export interface RedditPost {
  title: string
  url: string
  subreddit: string
  score: number
  created: number
}

export interface VideoIdea {
  title: string
  thumbDesign: string
  videoIdea: string
}

