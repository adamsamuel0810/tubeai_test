import { NextRequest, NextResponse } from 'next/server'
import { getChannelIdFromUrl, getChannelInfo, getChannelVideos } from '@/lib/youtube'
import { analyzeTopics, generateVideoIdeas } from '@/lib/ai'
import { fetchRelevantNews } from '@/lib/news'
import { searchReddit } from '@/lib/reddit'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key is not configured' },
        { status: 500 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { channelUrl, channelId: providedChannelId } = body || {}

    if (!channelUrl || typeof channelUrl !== 'string') {
      return NextResponse.json(
        { error: 'Valid channel URL is required' },
        { status: 400 }
      )
    }

    if (!channelUrl.includes('youtube.com') && !channelUrl.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      )
    }

    let channelId = providedChannelId
    if (!channelId) {
      channelId = await getChannelIdFromUrl(channelUrl)
      if (!channelId) {
        return NextResponse.json(
          { error: 'Could not extract channel ID from URL' },
          { status: 400 }
        )
      }
    }

    const [channelInfo, videos] = await Promise.all([
      getChannelInfo(channelId),
      getChannelVideos(channelId, 10),
    ])

    if (!channelInfo || videos.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch channel data or no videos found' },
        { status: 404 }
      )
    }

    let topics: string[] = []
    try {
      topics = await analyzeTopics(videos)
      if (topics.length === 0) {
        const words = videos.map(v => v.title.toLowerCase().split(/\s+/)).flat()
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
        topics = [...new Set(words.filter(w => w.length > 4 && !commonWords.has(w)))].slice(0, 5)
      }
    } catch (error) {
      console.error('Error analyzing topics:', error)
      const words = videos.map(v => v.title.toLowerCase().split(/\s+/)).flat()
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
      topics = [...new Set(words.filter(w => w.length > 4 && !commonWords.has(w)))].slice(0, 5)
    }

    if (topics.length === 0) {
      topics = ['general content', 'trending topics', 'popular videos', 'engaging content', 'viral content']
    }

    const [news, redditPosts] = await Promise.allSettled([
      fetchRelevantNews(topics),
      searchReddit(topics),
    ]).then(results => [
      results[0].status === 'fulfilled' ? results[0].value : [],
      results[1].status === 'fulfilled' ? results[1].value : [],
    ])

    let ideas
    try {
      ideas = await generateVideoIdeas(
        topics,
        channelInfo.title,
        videos,
        news.map(n => ({ title: n.title, url: n.url })),
        (redditPosts as any[]).map(p => ({ title: p.title, subreddit: p.subreddit || 'unknown' }))
      )
      if (ideas.length < 5) {
        const fallbackIdeas = topics.slice(ideas.length, 5).map((topic, idx) => ({
          title: `Latest on ${topic}`,
          thumbDesign: 'Bold text on gradient background with relevant icon',
          videoIdea: `A comprehensive video covering the latest developments in ${topic}, incorporating current trends and audience interests.`,
        }))
        ideas = [...ideas, ...fallbackIdeas].slice(0, 5)
      }
    } catch (error) {
      console.error('Error generating ideas:', error)
      const fallbackTopics = topics.length > 0 ? topics : ['trending content', 'popular topics', 'engaging videos', 'viral content', 'latest updates']
      ideas = fallbackTopics.slice(0, 5).map((topic, idx) => ({
        title: `Latest Updates on ${topic}`,
        thumbDesign: 'Bold text on gradient background with relevant icon',
        videoIdea: `A comprehensive video covering the latest developments in ${topic}, incorporating current trends and audience interests.`,
      }))
    }

    if (!ideas || ideas.length === 0) {
      ideas = topics.slice(0, 5).map((topic, idx) => ({
        title: `Latest Updates on ${topic}`,
        thumbDesign: 'Bold text on gradient background with relevant icon',
        videoIdea: `A comprehensive video covering the latest developments in ${topic}, incorporating current trends and audience interests.`,
      }))
    }

    return NextResponse.json({
      channel: {
        id: channelInfo.id,
        title: channelInfo.title,
      },
      videos: videos.map(v => ({
        title: v.title,
        videoId: v.id,
      })),
      topics,
      news: (news || []).map((n: any) => ({
        title: n.title || 'Untitled',
        url: n.url || '#',
        source: n.source || 'Unknown',
      })),
      redditPosts: (redditPosts || []).map((p: any) => ({
        title: p.title || 'Untitled',
        url: p.url || '#',
        subreddit: p.subreddit || 'unknown',
        score: p.score || 0,
      })),
      ideas: ideas || [],
    })
  } catch (error: any) {
    console.error('Error in analyze route:', error)
    
    let errorMessage = 'Internal server error'
    let statusCode = 500

    if (error.message) {
      errorMessage = error.message
      if (error.message.includes('API key')) {
        statusCode = 500
      } else if (error.message.includes('not found')) {
        statusCode = 404
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        statusCode = 429
        errorMessage = 'API rate limit exceeded. Please try again later.'
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

