"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, BrainCircuit, LayoutTemplate, Lightbulb, BookOpen, ChevronRight, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { askAI } from "@/app/writing/actions" // 引入刚才写的后端方法
import ReactMarkdown from "react-markdown" // 推荐安装: bun add react-markdown

interface AICopilotProps {
    questionContent: string
    taskType: 'task1' | 'task2'
    isOpen: boolean
    onToggle: () => void
}

export function AICopilot({ questionContent, taskType, isOpen, onToggle }: AICopilotProps) {
    const [activeTab, setActiveTab] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [result, setResult] = React.useState<string | null>(null)

    // 处理 AI 请求
    const handleAsk = async (intent: string) => {
        if (loading) return
        setActiveTab(intent)
        setLoading(true)
        setResult(null)

        const res = await askAI(questionContent, taskType, intent)

        if (res.success && res.data) {
            setResult(res.data)
        } else {
            setResult("Sorry, AI connection failed.")
        }
        setLoading(false)
    }

    // 渲染内容区域
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-40 space-y-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm animate-pulse">DeepSeek is analyzing...</p>
                </div>
            )
        }

        if (!result) return null

        // 如果是词汇模式，我们需要特殊解析 JSON 来显示卡片
        if (activeTab === "vocab") {
            try {
                // 简单的 JSON 清洗，防止 DeepSeek 返回 Markdown 包裹
                const jsonStr = result.replace(/```json|```/g, "").trim()
                const data = JSON.parse(jsonStr)
                return <VocabView data={data} />
            } catch (e) {
                return <div className="prose prose-sm dark:prose-invert"><ReactMarkdown>{result}</ReactMarkdown></div>
            }
        }

        // 默认 Markdown 渲染
        return (
            <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
            </div>
        )
    }

    return (
        <div className={`relative h-full bg-zinc-50 dark:bg-[#121212] border-l border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${isOpen ? "w-80 md:w-96" : "w-0"}`}>

            {/* 展开/收起按钮 (悬浮在边界上) */}
            <button
                onClick={onToggle}
                className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full p-1 shadow-sm z-20 hover:scale-110 transition-transform"
            >
                <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`} />
            </button>

            <div className={`h-full flex flex-col overflow-hidden ${!isOpen && "hidden"}`}>
                {/* Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-zinc-900 dark:text-white">AI Copilot</h3>
                </div>

                {/* Function Grid */}
                <div className="grid grid-cols-4 gap-2 p-4 pb-2">
                    <FeatureBtn icon={<BrainCircuit />} label="审题" active={activeTab === "analyze"} onClick={() => handleAsk("analyze")} />
                    <FeatureBtn icon={<LayoutTemplate />} label="模板" active={activeTab === "outline"} onClick={() => handleAsk("outline")} />
                    <FeatureBtn icon={<Lightbulb />} label="思路" active={activeTab === "ideas"} onClick={() => handleAsk("ideas")} />
                    <FeatureBtn icon={<BookOpen />} label="语料" active={activeTab === "vocab"} onClick={() => handleAsk("vocab")} />
                </div>

                {/* Result Area */}
                <ScrollArea className="flex-1 p-4">
                    {activeTab ? (
                        renderContent()
                    ) : (
                        <div className="text-center text-zinc-400 mt-10 text-sm px-8">
                            Select a tool above to get help from AI. I can analyze the task, suggest ideas, or give you golden sentences.
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}

// 子组件：功能按钮
function FeatureBtn({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"}`}
        >
            <div className={`w-6 h-6 ${!active && "opacity-70"}`}>{icon}</div>
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    )
}

// 子组件：语料展示卡片
function VocabView({ data }: { data: any }) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Golden Vocab</h4>
                {data.vocab?.map((v: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm flex justify-between group">
                        <div>
                            <div className="font-bold text-indigo-600 dark:text-indigo-400">{v.word}</div>
                            <div className="text-xs text-zinc-500">{v.meaning}</div>
                        </div>
                        {/* 这是一个保存按钮，你可以绑定之前的 addToVocab 逻辑 */}
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-4 h-4 text-zinc-400 hover:text-indigo-500" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">High-Level Sentences</h4>
                {data.sentences?.map((s: any, i: number) => (
                    <div key={i} className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 border border-indigo-100 dark:border-indigo-900/30">
                        {s.sentence}
                    </div>
                ))}
            </div>
        </div>
    )
}