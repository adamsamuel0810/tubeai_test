import OpenAI from 'openai'
import { YouTubeVideo, VideoIdea } from './types'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured')
  }
  return new OpenAI({
    apiKey,
  })
}

export async function analyzeTopics(videos: YouTubeVideo[]): Promise<string[]> {
  const videoTitles = videos.map(v => v.title).join('\n')
  const videoDescriptions = videos.slice(0, 5).map(v => v.description.substring(0, 200)).join('\n')

  const prompt = `Analyze the following YouTube video titles and descriptions from a channel. Extract the main topics and themes covered. Return a JSON object with a "topics" array containing 5-8 key topics, each as a single short phrase (2-4 words max).

Video Titles:
${videoTitles}

Video Descriptions (excerpts):
${videoDescriptions}

Return a JSON object in this exact format:
{
  "topics": ["topic1", "topic2", "topic3"]
}`

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a content analysis expert. Extract key topics from YouTube content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from AI')

    const parsed = JSON.parse(content)
    let topics = parsed.topics || parsed
    if (!Array.isArray(topics)) {
      topics = Object.values(parsed).find((v: any) => Array.isArray(v)) || []
    }
    return Array.isArray(topics) ? topics : []
  } catch (error) {
    console.error('Error analyzing topics:', error)
    const words = videoTitles.toLowerCase().split(/\s+/)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that', 'how', 'why', 'what', 'when', 'where'])
    const keywords = [...new Set(words.filter(w => w.length > 4 && !commonWords.has(w)))]
    return keywords.slice(0, 8)
  }
}

export async function generateVideoIdeas(
  topics: string[],
  channelTitle: string,
  recentVideos: YouTubeVideo[],
  newsArticles: Array<{ title: string; url: string }>,
  redditPosts: Array<{ title: string; subreddit: string }>
): Promise<VideoIdea[]> {
  const recentTitles = recentVideos.map(v => v.title).join('\n- ')
  const newsTitles = newsArticles.slice(0, 5).map(a => a.title).join('\n- ')
  const redditTitles = redditPosts.slice(0, 5).map(p => p.title).join('\n- ')

  const prompt = `You are a YouTube content strategist. Generate 5 video ideas for the channel "${channelTitle}".

Channel's Recent Video Titles:
- ${recentTitles}

Identified Topics: ${topics.join(', ')}

Relevant News Headlines:
- ${newsTitles || 'No recent news found'}

Relevant Reddit Discussions:
- ${redditTitles || 'No Reddit discussions found'}

Generate 5 video ideas that:
1. Match the channel's content style and topics
2. Incorporate current trends from news and Reddit
3. Are engaging and likely to perform well

For each idea, provide:
- TITLE: A compelling YouTube title (same style as the channel's recent videos)
- THUMB DESIGN: Description of thumbnail design elements (colors, text, imagery style)
- VIDEO IDEA: A detailed description of the video concept (2-3 sentences)

Return a JSON object with an "ideas" array, where each idea has "title", "thumbDesign", and "videoIdea" fields.

Example format:
{
  "ideas": [
    {
      "title": "Video Title Here",
      "thumbDesign": "Thumbnail design description",
      "videoIdea": "Detailed video concept description"
    }
  ]
}`

  try {
    if (topics.length === 0) {
      throw new Error('No topics provided')
    }
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert YouTube content strategist who creates engaging video ideas that match channel styles and current trends.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from AI')

    const parsed = JSON.parse(content)
    const ideas = parsed.ideas || []
    
    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('Invalid response format')
    }

    return ideas.map((idea: any) => ({
      title: idea.title || 'Untitled Video',
      thumbDesign: idea.thumbDesign || 'Standard thumbnail design',
      videoIdea: idea.videoIdea || 'Video concept description',
    }))
  } catch (error) {
    console.error('Error generating video ideas:', error)
    return topics.slice(0, 5).map((topic, idx) => ({
      title: `Latest Updates on ${topic}`,
      thumbDesign: `Bold text on gradient background with relevant icon`,
      videoIdea: `A comprehensive video covering the latest developments in ${topic}, incorporating current trends and audience interests.`,
    }))
  }
}

