"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { WritingEditor } from "./client-editor" // 复用我们之前的编辑器
import { BackBtn } from "@/components/ui/back-btn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, PenTool, Mail, Loader2 } from "lucide-react"
import { generateQuestionAction } from "./actions"
import { toast } from "sonner"

export function WritingManager({ user }: { user: any }) {
    // 状态机： 'setup' (出题) -> 'writing' (写作)
    const [step, setStep] = React.useState<'setup' | 'writing'>('setup')
    const [loading, setLoading] = React.useState(false)
    const [questionData, setQuestionData] = React.useState<any>(null)

    // 用于手动输入话题
    const [topic, setTopic] = React.useState("")

    const supabase = createClient()

    // 1. 调用 AI 生成题目
    const handleGenerate = async (type: 'task1' | 'task2') => {
        setLoading(true)
        const res = await generateQuestionAction(type, topic)

        if (res.success && res.data) {
            // 为了保持数据一致性，我们最好先把这个 AI 生成的题目存进数据库
            // 这样提交作文的时候才有 id 可查
            const { data: qData, error } = await supabase.from('writing_questions').insert({
                type: res.data.type,
                title: res.data.title,
                content: res.data.content,
                category: 'AI Generated'
            }).select().single()

            if (qData) {
                setQuestionData(qData)
                setStep('writing')
            } else {
                toast.error("Failed to save question")
            }
        } else {
            toast.error("AI is busy, please try again.")
        }
        setLoading(false)
    }

    // --- 视图 1: 题目生成器 ---
    if (step === 'setup') {
        return (
            <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex flex-col items-center justify-center p-6">
                <div className="absolute top-6 left-6">
                    <BackBtn label="Home" />
                </div>

                <div className="w-full max-w-lg space-y-8 text-center">
                    <div className="space-y-2">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 dark:bg-purple-900/30">
                            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Writing Simulator</h1>
                        <p className="text-zinc-500">
                            What do you want to practice today? <br />
                            AI will generate a unique question for you.
                        </p>
                    </div>

                    {/* 话题输入 (可选) */}
                    <div className="relative">
                        <Input
                            placeholder="Topic (e.g. Technology, Education) - Optional"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="h-12 text-center rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-32 flex flex-col gap-3 rounded-3xl border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                            onClick={() => handleGenerate('task1')}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Mail className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />}
                            <span className="font-bold text-lg">Task 1</span>
                            <span className="text-xs text-zinc-400 font-normal">Letter / Report</span>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-32 flex flex-col gap-3 rounded-3xl border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                            onClick={() => handleGenerate('task2')}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <PenTool className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />}
                            <span className="font-bold text-lg">Task 2</span>
                            <span className="text-xs text-zinc-400 font-normal">Essay</span>
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-400">
                        Powered by DeepSeek AI
                    </p>
                </div>
            </div>
        )
    }

    // --- 视图 2: 编辑器 ---
    return <WritingEditor question={questionData} user={user} onExit={() => setStep('setup')} />
}