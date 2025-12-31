"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
})

// 1. 现有的 Copilot 功能 (保持不变，略微精简)
export async function askAI(questionContent: string, taskType: string, intent: string) {
    // ... (保持你之前的代码逻辑，为了节省篇幅这里省略，重点是下面新增的)
    // 如果你之前的代码丢了，告诉我，我再发一遍完整版
    let systemPrompt = ""
    switch (intent) {
        case "analyze": systemPrompt = "你是一位雅思写作考官。请分析题目..."; break;
        case "outline": systemPrompt = "你是一位雅思写作导师。请提供高分结构模板..."; break;
        case "ideas": systemPrompt = "请提供Brainstorming素材..."; break;
        case "vocab": systemPrompt = "请推荐C1/C2高级词汇，返回JSON格式..."; break;
    }
    // ... fetch logic
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `题目：${questionContent}` }],
        model: "deepseek-chat",
    })
    return { success: true, data: completion.choices[0].message.content }
}

// 🆕 2. AI 出题功能
export async function generateQuestionAction(type: 'task1' | 'task2', topic?: string) {
  const prompt = topic 
    ? `请生成一道雅思G类写作 ${type === 'task1' ? '书信' : '大作文'} 题目，话题关于 "${topic}"。`
    : `请随机生成一道标准的雅思G类写作 ${type === 'task1' ? '书信' : '大作文'} 真题。`

  const system = `你是一个雅思出题官。请直接返回题目内容，格式要求 JSON：
  {
    "title": "简短标题",
    "content": "完整的题目描述，包含 bullet points",
    "type": "${type}"
  }
  只返回 JSON，不要 Markdown。`

  try {
    const res = await openai.chat.completions.create({
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      model: "deepseek-chat",
      response_format: { type: "json_object" } 
    })
    return { success: true, data: JSON.parse(res.choices[0].message.content || "{}") }
  } catch (e) {
    return { success: false, error: "AI Failed to generate question" }
  }
}

// 🆕 3. AI 批改功能
export async function gradeEssayAction(question: string, essay: string) {
  const system = `你是一位雅思前考官。请根据 TR, CC, LR, GRA 四项标准对用户的作文进行打分。
  请返回 JSON 格式：
  {
    "overall_score": "6.5",
    "breakdown": { "TR": 6, "CC": 7, "LR": 6, "GRA": 7 },
    "feedback": "简短的整体评价...",
    "suggestions": ["建议1", "建议2"]
  }`

  try {
    const res = await openai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: `题目：${question}\n\n考生作文：${essay}` }
      ],
      model: "deepseek-chat",
      response_format: { type: "json_object" }
    })
    return { success: true, data: JSON.parse(res.choices[0].message.content || "{}") }
  } catch (e) {
    return { success: false, error: "Grading failed" }
  }
}

export async function generateSampleAction(question: string) {
  try {
    const res = await openai.chat.completions.create({
      messages: [
        { 
            role: "system", 
            content: "你是一位雅思8分考生。请针对该题目写一篇满分范文。直接返回文章内容。Keep it concise and high-quality." 
        },
        { role: "user", content: question }
      ],
      model: "deepseek-chat",
      max_tokens: 500 
    })
    return { success: true, data: res.choices[0].message.content }
  } catch (e) {
    return { success: false, error: "Sample gen failed" }
  }
}