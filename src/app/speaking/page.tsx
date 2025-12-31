"use client"

import * as React from "react"
import { BackBtn } from "@/components/ui/back-btn"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Volume2, RotateCcw, MessageSquare, Sparkles, X, ChevronDown, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { processSpeakingAction } from "./actions" // 引入后端

// 消息类型定义
interface Message {
    id: string
    role: 'ai' | 'user'
    content: string
    analysis?: string
}

export default function SpeakingPage() {
    // 状态机：idle(空闲) -> listening(听你说) -> thinking(AI思考) -> speaking(AI说话)
    const [status, setStatus] = React.useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle')
    const [showChat, setShowChat] = React.useState(false)

    // 核心数据
    const [messages, setMessages] = React.useState<Message[]>([
        { id: 'init', role: 'ai', content: "Hello. Could you tell me your full name, please?" }
    ])

    // 语音识别实例引用
    const recognitionRef = React.useRef<any>(null)

    // 1. 初始化语音识别 (Web Speech API)
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = false // 说完一句自动停
                recognition.lang = 'en-US' // 识别英语
                recognition.interimResults = false

                recognition.onstart = () => setStatus('listening')

                // 识别结束：拿到结果 -> 发送给 AI
                recognition.onresult = (event: any) => {
                    const text = event.results[0][0].transcript
                    handleUserSpeaking(text)
                }

                recognition.onerror = (event: any) => {
                    console.error("Speech Error:", event.error)
                    setStatus('idle')
                    toast.error("Listening failed. Please try again.")
                }

                recognition.onend = () => {
                    // 如果是正常结束，状态会在 handleUserSpeaking 里流转
                    // 如果是没说话自动断开，重置为 idle
                }

                recognitionRef.current = recognition
            } else {
                toast.error("Your browser does not support Speech Recognition.")
            }
        }
    }, [])

    // 2. 朗读功能 (TTS)
    const speak = (text: string) => {
        if (typeof window === 'undefined') return

        // 停止之前的发声
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = 1.0 // 语速

        // 尝试找一个好听的女声
        const voices = window.speechSynthesis.getVoices()
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"))
        if (preferredVoice) utterance.voice = preferredVoice

        utterance.onstart = () => setStatus('speaking')
        utterance.onend = () => setStatus('idle')

        window.speechSynthesis.speak(utterance)
    }

    // 3. 核心流程：处理用户输入 -> 呼叫 AI -> 播放 AI 回复
    const handleUserSpeaking = async (userText: string) => {
        if (!userText.trim()) return

        // A. 上屏用户的话
        const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userText }
        setMessages(prev => [...prev, newMsg])

        setStatus('thinking') // 转圈圈

        // B. 呼叫后端 DeepSeek
        // 我们把之前的消息记录转成 OpenAI 格式传过去，为了省 token 只传最近几条
        const historyForAI = messages.slice(-4).map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
        }))

        const res = await processSpeakingAction(historyForAI, userText)

        if (res.success && res.data) {
            // C. AI 回复上屏
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: res.data.reply
            }

            // 更新上一条用户消息，把润色建议补进去 (这招很关键！)
            setMessages(prev => {
                const list = [...prev, aiMsg]
                const lastUserIdx = list.findIndex(m => m.id === newMsg.id)
                if (lastUserIdx !== -1) {
                    list[lastUserIdx].analysis = res.data.analysis
                }
                return list
            })

            // D. 朗读 AI 回复
            speak(res.data.reply)
        } else {
            toast.error("AI is sleeping... Try again.")
            setStatus('idle')
        }
    }

    // 4. 按钮点击事件
    const toggleListening = () => {
        if (!recognitionRef.current) return

        if (status === 'listening') {
            recognitionRef.current.stop()
            setStatus('idle')
        } else {
            try {
                recognitionRef.current.start()
            } catch (e) {
                // 防止频繁点击报错
                console.log("Mic already active")
            }
        }
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative font-sans">

            {/* 顶部 Header */}
            <div className="flex-none p-6 z-30 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <BackBtn label="End" />
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Part 1</span>
                    <span className="text-xs text-zinc-600">Simulated Exam</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-white"
                    onClick={() => setShowChat(!showChat)}
                >
                    {showChat ? <ChevronDown /> : <MessageSquare className="w-5 h-5" />}
                </Button>
            </div>

            {/* 核心区域 */}
            <div className="flex-1 flex flex-col relative overflow-hidden">

                {/* 声波球 (视觉反馈) */}
                <motion.div
                    layout
                    className={cn(
                        "relative flex items-center justify-center transition-all duration-500",
                        showChat ? "flex-none h-32 opacity-80 scale-75" : "flex-1"
                    )}
                >
                    <motion.div
                        animate={{
                            scale: status === 'listening' ? [1, 1.2, 1] : status === 'speaking' ? [1, 1.05, 1] : 1,
                            opacity: status === 'listening' ? 0.5 : 0.2
                        }}
                        transition={{ repeat: Infinity, duration: status === 'listening' ? 2 : 0.5 }}
                        className={cn(
                            "absolute inset-0 rounded-full blur-3xl pointer-events-none transition-colors duration-500",
                            status === 'thinking' ? "bg-purple-500/30" : "bg-blue-500/30"
                        )}
                    />

                    <motion.div
                        layout
                        className={cn(
                            "w-40 h-40 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)] flex items-center justify-center border border-white/10 relative z-10 transition-colors duration-500",
                            status === 'thinking' ? "bg-gradient-to-b from-purple-600 to-indigo-900" : "bg-gradient-to-b from-blue-600 to-indigo-900"
                        )}
                    >
                        {status === 'thinking' ? (
                            <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
                        ) : status === 'listening' ? (
                            <Mic className="w-12 h-12 text-white animate-pulse" />
                        ) : (
                            <Volume2 className="w-12 h-12 text-white/80" />
                        )}
                    </motion.div>
                </motion.div>

                {/* 聊天列表 */}
                <div className="flex-1 overflow-hidden relative z-20 w-full max-w-2xl mx-auto">
                    {showChat ? (
                        <ScrollArea className="h-full px-6 pb-4">
                            <div className="space-y-6 pb-20">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-[1.5rem] px-5 py-3 text-lg leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-zinc-800 text-white rounded-tr-sm"
                                                : "bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tl-sm"
                                        )}>
                                            {msg.content}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="mt-2 -mr-2">
                                                <AIAnalysisCard analysis={msg.analysis} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* 这是一个隐形的锚点，保证滚动到底部 */}
                                <div className="h-4" />
                            </div>
                        </ScrollArea>
                    ) : (
                        // 沉浸字幕
                        <div className="absolute bottom-10 left-0 right-0 px-6 text-center">
                            <AnimatePresence mode="wait">
                                {messages.length > 0 && (
                                    <motion.p
                                        key={messages[messages.length - 1].id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="text-2xl font-medium text-white/90 leading-relaxed drop-shadow-md"
                                    >
                                        "{messages[messages.length - 1].content}"
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

            </div>

            {/* 底部按钮栏 */}
            <div className="flex-none p-8 pb-10 flex justify-center items-center gap-8 bg-black/80 backdrop-blur-lg z-30">
                <Button
                    size="icon" variant="ghost"
                    className="w-12 h-12 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => {
                        setMessages([{ id: 'init', role: 'ai', content: "Let's restart. What is your full name?" }])
                        setStatus('idle')
                        window.speechSynthesis.cancel()
                    }}
                >
                    <RotateCcw className="w-5 h-5" />
                </Button>

                <button
                    onClick={toggleListening}
                    disabled={status === 'thinking' || status === 'speaking'}
                    className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 border-transparent",
                        status === 'listening'
                            ? 'bg-red-500 scale-110 shadow-red-500/40 animate-pulse border-red-300'
                            : 'bg-white hover:scale-105 text-black',
                        (status === 'thinking' || status === 'speaking') && "opacity-50 cursor-not-allowed bg-zinc-700"
                    )}
                >
                    {status === 'listening' ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8" />}
                </button>

                {/* 仅用于调试或手动播放 */}
                <Button
                    size="icon" variant="ghost"
                    className="w-12 h-12 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => speak(messages[messages.length - 1].content)}
                >
                    <Volume2 className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}

// 润色建议卡片 (保持之前写的即可)
function AIAnalysisCard({ analysis }: { analysis?: string }) {
    const [isOpen, setIsOpen] = React.useState(false)
    if (!analysis) return null
    return (
        <div className="flex flex-col items-end">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-400/10 px-3 py-1.5 rounded-full"
                >
                    <Sparkles className="w-3 h-3" />
                    Review
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative max-w-sm bg-zinc-900 border border-amber-500/30 p-4 rounded-2xl shadow-xl mt-1 text-left"
                >
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="absolute top-2 right-2 text-zinc-500 hover:text-white">
                        <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">AI Coach</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {analysis}
                    </p>
                </motion.div>
            )}
        </div>
    )
}