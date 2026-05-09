import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'
import { LANG_PROMPT } from '@/lib/translations'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const licenseKey = formData.get('license_key') as string
  const screenshot = formData.get('screenshot') as File | null
  const matchDate = formData.get('match_date') as string
  const matchTime = formData.get('match_time') as string
  const matchTimezone = formData.get('match_timezone') as string
  const lang = (formData.get('lang') as string) || 'pl'

  if (!licenseKey) return NextResponse.json({ error: 'Brak klucza licencyjnego' }, { status: 400 })

  const { data: license, error } = await supabaseAdmin
    .from('license_keys').select('*').eq('key', licenseKey.toUpperCase()).eq('is_active', true).single()

  if (error || !license) return NextResponse.json({ error: 'Nieprawidłowy klucz' }, { status: 401 })
  if (license.credits_remaining <= 0) return NextResponse.json({ error: 'Brak dostępnych analiz' }, { status: 403 })

  const matchDateTime = matchDate && matchTime
    ? `Match date: ${matchDate}, time: ${matchTime} (timezone: ${matchTimezone || 'CET'})`
    : ''

  const langInstruction = LANG_PROMPT[lang as keyof typeof LANG_PROMPT] || LANG_PROMPT['pl']

  const systemPrompt = `You are a professional sports analyst with over 20 years of experience. You analyze matches based purely on statistics — never on betting odds.

LANGUAGE INSTRUCTION: ${langInstruction}

${matchDateTime ? `IMPORTANT: ${matchDateTime}. Use this date to check the weather forecast for the match city.` : ''}

RULES:
- Use real statistics and data
- Check weather forecast for match day in the match city
- Keep language simple — as if explaining to someone with no sports background
- All numbers must be based on real data

RESPONSE FORMAT — exactly these three sections in order:

📍 PLACE AND CONDITIONS
Stadium and city. Weather forecast for match day: temperature, rain chance, wind, humidity. How weather conditions affect both teams' playing style — explained simply.

📊 MATHEMATICAL ANALYSIS
Average goals scored and conceded per match by each team (in simple terms like "Bayern scores about 3 goals per game and concedes less than 1").
Home vs away win rate for both teams in %.
Average ball possession and shots on target per match.
Win rate in similar weather conditions.

🎯 VERDICT
Team X vs Team Y has a WIN probability of XYZ percent.
Write 3-4 sentences of simple explanation why — avoid technical jargon, explain like talking to a friend.`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (screenshot) {
    const bytes = await screenshot.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = screenshot.type as 'image/jpeg' | 'image/png' | 'image/webp'
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: `Analyze this match carefully. ${matchDateTime}. ${langInstruction}` },
      ],
    })
  } else {
    return NextResponse.json({ error: 'No screenshot provided' }, { status: 400 })
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 1200,
  })

  const result = completion.choices[0].message.content || 'No response'

  await supabaseAdmin.from('license_keys')
    .update({ credits_remaining: license.credits_remaining - 1 })
    .eq('key', licenseKey.toUpperCase())

  await supabaseAdmin.from('analyses').insert({ license_key_id: license.id, result })

  return NextResponse.json({ result })
}