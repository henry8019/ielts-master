"use client"

import * as React from "react"
import { BackBtn } from "@/components/ui/back-btn"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, FileQuestion, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ArticleViewer } from "@/components/reading/article-viewer" // 👈 引入新组件

export function ReadingClient({ article }: { article: any }) {
    const [hasStarted, setHasStarted] = React.useState(false)
    const [timeLeft, setTimeLeft] = React.useState(60 * 20)
    const [isMobile, setIsMobile] = React.useState(false)

    // ... (保留之前的倒计时和 Resize 逻辑) ...
    // 1. 倒计时
    React.useEffect(() => {
        if (!hasStarted) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [hasStarted])

    // 2. 屏幕检测
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Cover View
    if (!hasStarted) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F5F5F7] dark:bg-black p-4">
                <div className="absolute top-6 left-6">
                    <BackBtn label="Dashboard" />
                </div>
                <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div className="p-10 md:p-16 text-center space-y-8">
                        <div className="space-y-4">
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Reading Module
                            </span>
                            {/* 使用真实数据 */}
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                {article.title}
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400">
                                {article.subtitle || "General Training Test"}
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Button
                                size="lg"
                                className="h-14 rounded-full bg-zinc-900 px-10 text-lg font-semibold text-white shadow-xl hover:bg-zinc-800 transition-all dark:bg-white dark:text-black"
                                onClick={() => setHasStarted(true)}
                            >
                                Start Exam <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Exam View
    return (
        <div className="flex flex-col h-screen bg-[#F2F2F7] dark:bg-black overflow-hidden">
            {/* Header */}
            <div className="flex-none px-4 pt-4 pb-2 z-20 flex items-center justify-between max-w-[1920px] mx-auto w-full">
                <Button variant="ghost" onClick={() => setHasStarted(false)}>Quit</Button>
                <div className={cn("flex items-center gap-3 px-5 py-2 rounded-full font-mono font-bold shadow-lg bg-zinc-900 text-white dark:bg-white dark:text-black")}>
                    <Clock className="w-4 h-4 opacity-70" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
                <Button size="sm" className="rounded-full bg-emerald-600 text-white">Submit</Button>
            </div>

            <div className="flex-1 overflow-hidden p-4 pt-2">
                {isMobile ? (
                    <Tabs defaultValue="article" className="h-full flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border border-white/20">
                        <div className="flex-1 overflow-hidden relative bg-white dark:bg-zinc-900">
                            <TabsContent value="article" className="h-full m-0 p-0 overflow-y-auto">
                                <div className="p-6 pb-20">
                                    {/* 👇 使用新组件 */}
                                    <ArticleViewer content={article.content} />
                                </div>
                            </TabsContent>
                            <TabsContent value="questions" className="h-full m-0 p-0 overflow-y-auto bg-zinc-50 dark:bg-black/50">
                                <div className="p-6 pb-20">
                                    <QuestionList questions={article.questions} />
                                </div>
                            </TabsContent>
                        </div>
                        {/* TabsList... */}
                    </Tabs>
                ) : (
                    <div className="flex h-full w-full gap-4 max-w-[1920px] mx-auto">
                        {/* 左侧：文章 */}
                        <div className="flex-1 h-full overflow-hidden rounded-[2rem] bg-white shadow-sm border border-zinc-200/60 dark:bg-[#1c1c1e] dark:border-zinc-800 relative group">
                            <ScrollArea className="h-full p-8 md:p-12">
                                <div className="max-w-3xl mx-auto pb-20">
                                    {/* 👇 使用新组件 */}
                                    <ArticleViewer content={article.content} />
                                </div>
                            </ScrollArea>
                        </div>

                        {/* 右侧：题目 */}
                        <div className="flex-1 h-full overflow-hidden rounded-[2rem] bg-[#FAFAFA] shadow-inner border border-zinc-200/60 dark:bg-black dark:border-zinc-800">
                            <ScrollArea className="h-full p-8 md:p-10">
                                <div className="max-w-2xl mx-auto pb-20">
                                    <QuestionList questions={article.questions} />
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// 题目列表组件 (保持不变，略)
function QuestionList({ questions }: { questions: any[] }) {
    if (!questions) return <div>No questions</div>
    return (
        <div className="space-y-4">
            {questions.map((q, idx) => (
                <div key={idx} className="group p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                    <div className="flex gap-4 items-start">
                        <span className="flex-none flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 text-sm font-bold text-zinc-500">{idx + 1}</span>
                        <div className="space-y-2 w-full">
                            <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">{q.question}</p>
                            <input type="text" className="w-full bg-zinc-50 rounded-lg border-0 px-4 py-2 text-sm" placeholder="Answer..." />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}