"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { BackBtn } from "@/components/ui/back-btn"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Send, CheckCircle2, Bot, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { AICopilot } from "@/components/writing/ai-copilot"
import { gradeEssayAction, generateSampleAction } from "./actions"
import ReactMarkdown from "react-markdown"

interface WritingEditorProps {
    question: any
    user: any
    onExit: () => void
}

export function WritingEditor({ question, user, onExit }: WritingEditorProps) {
    const [content, setContent] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isDone, setIsDone] = React.useState(false)
    const [isCopilotOpen, setIsCopilotOpen] = React.useState(false)

    // AI 批改相关状态
    const [grading, setGrading] = React.useState<any>(null)
    const [sample, setSample] = React.useState<string | null>(null)
    const [analyzing, setAnalyzing] = React.useState(false)

    const supabase = createClient()

    const wordCount = React.useMemo(() => {
        return content.trim().split(/\s+/).filter(w => w.length > 0).length
    }, [content])

    const handleSubmit = async () => {
        if (wordCount < 10) {
            toast.error("At least 10 words required.")
            return
        }
        setIsSubmitting(true)

        // 1. 保存到 Supabase
        const { error } = await supabase.from('writing_submissions').insert({
            user_id: user.id,
            question_id: question.id,
            essay_content: content,
            word_count: wordCount,
            status: 'submitted'
        })

        if (!error) {
            toast.success("Submitted! AI is reviewing...")
            setIsDone(true) // 切换到结果页
            setAnalyzing(true) // 开始转圈等待 AI

            // 2. 触发 AI 批改
            const gradeRes = await gradeEssayAction(question.content, content)
            if (gradeRes.success) {
                setGrading(gradeRes.data)
            } else {
                toast.error("AI grading failed, please try again.")
            }
            setAnalyzing(false)
        } else {
            toast.error("Failed to save essay")
        }
        setIsSubmitting(false)
    }

    // 获取范文
    const handleGetSample = async () => {
        const res = await generateSampleAction(question.content)
        if (res.success) setSample(res.data)
        else toast.error("Failed to generate sample")
    }

    // --- 视图 1: 结果页 (AI 评分报告) ---
    if (isDone) {
        return (
            <div className="flex h-screen w-full bg-[#F5F5F7] dark:bg-black overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full p-6 md:p-12 space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Assessment Report</h1>
                        <Button variant="outline" onClick={onExit}>Start New</Button>
                    </div>

                    {/* 1. 评分卡片 */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 min-h-[400px]">
                        {analyzing ? (
                            // 👇 这里替换成了新的组件
                            <AIAnalysisLoader />
                        ) : grading ? (
                            // ... 原有的 grading 显示逻辑 ...
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* ... */}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-red-500">Failed to load grading report.</div>
                        )}
                    </div>

                    {/* 2. 范文卡片 */}
                    {grading && (
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                    <Sparkles className="w-6 h-6 text-yellow-500" /> Model Answer
                                </h2>
                                {!sample && (
                                    <Button onClick={handleGetSample} variant="secondary">Generate 9.0 Sample</Button>
                                )}
                            </div>

                            {sample && (
                                <div className="prose prose-zinc dark:prose-invert max-w-none bg-zinc-50 dark:bg-black p-6 md:p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <ReactMarkdown>{sample}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        )
    }

    // --- 视图 2: 编辑器 ---
    return (
        <div className="flex flex-col h-screen bg-[#F5F5F7] dark:bg-black overflow-hidden">

            {/* 顶部导航 */}
            <div className="flex-none px-4 py-3 md:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 backdrop-blur-md dark:bg-black/50 z-10 flex items-center justify-between">
                <BackBtn label="Quit" />

                <div className="flex items-center gap-3">
                    <Button
                        variant={isCopilotOpen ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                        className="hidden md:flex gap-2"
                    >
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        {isCopilotOpen ? "Close AI" : "AI Copilot"}
                    </Button>

                    <div className="text-sm font-medium text-zinc-500 font-mono w-20 text-right">
                        {wordCount} words
                    </div>

                    <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                    </Button>
                </div>
            </div>

            {/* 主体区域 */}
            <div className="flex-1 flex flex-row h-full overflow-hidden relative">

                {/* 左侧：题目卡片 */}
                <div className="hidden lg:block w-[350px] p-6 bg-white dark:bg-[#121212] overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="space-y-6">
                        <div>
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3 dark:bg-purple-900/30 dark:text-purple-300">
                                {question.type === 'task1' ? 'Task 1' : 'Task 2'}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                {question.title}
                            </h2>
                        </div>
                        <div className="prose prose-sm prose-zinc dark:prose-invert">
                            {question.content}
                        </div>

                        <div className="lg:hidden p-4 bg-purple-50 text-purple-700 text-xs rounded-lg">
                            Tap the sparkle icon to use AI.
                        </div>
                    </div>
                </div>

                {/* 中间：编辑器 */}
                <div className="flex-1 relative h-full flex flex-col bg-white dark:bg-zinc-900">
                    <div className="lg:hidden p-4 bg-zinc-50 dark:bg-zinc-950 border-b text-sm font-medium truncate">
                        📝 {question.title}
                    </div>

                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start typing your essay..."
                        className="flex-1 w-full p-6 md:p-10 resize-none border-0 bg-transparent text-lg leading-relaxed focus-visible:ring-0 font-serif"
                    />

                    {!isCopilotOpen && (
                        <button
                            onClick={() => setIsCopilotOpen(true)}
                            className="md:hidden absolute bottom-6 right-6 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg text-white z-20"
                        >
                            <Sparkles className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* 右侧：AI Copilot */}
                <AICopilot
                    questionContent={question.content}
                    taskType={question.type}
                    isOpen={isCopilotOpen}
                    onToggle={() => setIsCopilotOpen(!isCopilotOpen)}
                />
            </div>
        </div>
    )
}

function AIAnalysisLoader() {
    const [step, setStep] = React.useState(0)
    const steps = [
        "Connecting to AI Examiner...",
        "Scanning vocabulary usage...",
        "Checking grammar & syntax...",
        "Analyzing task response...",
        "Generating score report..."
    ]

    React.useEffect(() => {
        // 每 1.5 秒切换一段文案，模拟 AI 正在工作的进度
        const interval = setInterval(() => {
            setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
        }, 1500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center h-full py-20 space-y-8 animate-in fade-in duration-500">
            {/* 核心动画区 */}
            <div className="relative w-24 h-24">
                {/* 外层呼吸光环 */}
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                {/* 旋转的圆环 */}
                <Loader2 className="w-24 h-24 text-purple-600 animate-spin relative z-10" strokeWidth={1} />
                {/* 中间的图标 */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Bot className="w-10 h-10 text-purple-600 animate-bounce" />
                </div>
            </div>

            <div className="text-center space-y-2 max-w-xs mx-auto">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {steps[step]}
                </h3>
                <p className="text-zinc-400 text-sm">
                    This might take a few seconds...
                </p>
            </div>

            {/* 进度条装饰 */}
            <div className="w-48 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-purple-600 transition-all duration-500 ease-out"
                    style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    )
}