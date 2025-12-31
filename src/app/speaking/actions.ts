"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function processSpeakingAction(history: any[], userOpenInput: string) {
  const systemPrompt = `你是一位专业的雅思口语考官（IELTS Speaking Examiner）。
  
  你的任务是：
  1. **推进考试**：根据用户的回答，自然地进行下一个提问（Part 1/2/3）。保持考官的专业、客观但友好的语气。
  2. **即时反馈**：分析用户刚才这句话的语法错误或不地道的表达，并给出“高分重述”。

  请严格返回 JSON 格式，不要包含 Markdown 标记：
  {
    "reply": "AI 考官的口语回应（英文）",
    "analysis": "针对用户刚才回答的润色建议（中文解释 + 英文重述）"
  }`

  // 构建消息历史，保留最近 6 轮对话以维持上下文
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6), 
    { role: "user", content: userOpenInput }
  ]

  try {
    const completion = await openai.chat.completions.create({
      messages: messages as any,
      model: "deepseek-chat",
      response_format: { type: "json_object" }, // 强制 JSON
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    return { success: true, data: result }
  } catch (error) {
    console.error("DeepSeek Speaking Error:", error)
    return { success: false, error: "AI Connection Failed" }
  }
}