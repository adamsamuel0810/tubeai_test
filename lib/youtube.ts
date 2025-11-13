import axios from 'axios'
import { YouTubeVideo, ChannelInfo } from './types'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function getChannelIdFromUrl(url: string): Promise<string | null> {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const identifier = match[1]
      
      if (url.includes('/@')) {
        try {
          const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
            params: {
              part: 'snippet',
              q: `@${identifier}`,
              type: 'channel',
              maxResults: 1,
              key: YOUTUBE_API_KEY,
            },
          })
          if (response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0]
            if (item.id && typeof item.id === 'object' && 'channelId' in item.id) {
              return item.id.channelId as string
            }
            if (item.snippet?.channelId) {
              return item.snippet.channelId
            }
          }
        } catch (error) {
          console.error('Error resolving handle:', error)
        }
      }
      
      if (url.includes('/channel/')) {
        return identifier
      }
      
      try {
        const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
          params: {
            part: 'id',
            forUsername: identifier,
            key: YOUTUBE_API_KEY,
          },
        })
        if (response.data.items && response.data.items.length > 0) {
          return response.data.items[0].id
        }
      } catch (error) {
        try {
          const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
            params: {
              part: 'snippet',
              q: identifier,
              type: 'channel',
              maxResults: 1,
              key: YOUTUBE_API_KEY,
            },
          })
          if (response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0]
            if (item.id && typeof item.id === 'object' && 'channelId' in item.id) {
              return item.id.channelId as string
            }
            if (item.snippet?.channelId) {
              return item.snippet.channelId
            }
          }
        } catch (err) {
          console.error('Error resolving channel:', err)
        }
      }
    }
  }
  
  return null
}

export async function getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'snippet',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    })

    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0].snippet
      return {
        id: channelId,
        title: channel.title,
        description: channel.description,
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching channel info:', error)
    return null
  }
}

export async function getChannelVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured')
  }

  try {
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    })

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found or invalid channel ID')
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads
    
    if (!uploadsPlaylistId) {
      throw new Error('Channel has no uploads playlist')
    }

    const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults,
        key: YOUTUBE_API_KEY,
      },
    })

    if (!videosResponse.data.items || videosResponse.data.items.length === 0) {
      return []
    }

    const videos: YouTubeVideo[] = videosResponse.data.items
      .filter((item: any) => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId)
      .map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title || 'Untitled',
        description: item.snippet.description || '',
        publishedAt: item.snippet.publishedAt || '',
        thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url || '',
      }))

    return videos
  } catch (error: any) {
    console.error('Error fetching channel videos:', error)
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded or API key invalid')
    }
    if (error.response?.status === 404) {
      throw new Error('Channel not found')
    }
    throw new Error(error.message || 'Failed to fetch channel videos')
  }
}

