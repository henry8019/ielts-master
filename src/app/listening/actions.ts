"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
})

// 1. 生成剧本 (DeepSeek)
// 我们只返回文本，不返回音频
export async function generateListeningScriptAction(topic?: string) {
  const selectedTopic = topic || "Random Daily Conversation"

  const systemPrompt = `你是一位雅思听力出题人。请生成一段 **Part 1 对话** 听力原文。
  话题：${selectedTopic}。
  
  要求：
  1. 必须包含 **Man** 和 **Woman** 两个角色。
  2. 包含具体细节（名字、数字、时间、地点），适合听写。
  3. 总长度约 8-12 句对话。
  4. 返回 JSON: { "title": "标题", "script": [{ "speaker": "Man", "text": "..." }, { "speaker": "Woman", "text": "..." }] }`

  try {
    const res = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "Generate" }],
      model: "deepseek-chat",
      response_format: { type: "json_object" }
    })
    return { success: true, data: JSON.parse(res.choices[0].message.content || "{}") }
  } catch (e: any) {
    return { success: false, error: "Script Generation Failed" }
  }
}

// 2. 听写批改 (DeepSeek)
export async function analyzeDictationAction(originalText: string, userText: string) {
    const systemPrompt = `你是一位雅思听力专家。对比用户听写与原文。
    返回 JSON: { "score": 85, "feedback": "...", "corrections": [{"word": "xx", "explanation": "..."}] }`

    try {
        const res = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `原文：${originalText}\n用户听写：${userText}` }
            ],
            model: "deepseek-chat",
            response_format: { type: "json_object" }
        })
        return { success: true, data: JSON.parse(res.choices[0].message.content || "{}") }
    } catch (e) {
        return { success: false, error: "AI Analysis Failed" }
    }
}