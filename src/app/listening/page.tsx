"use client"

import * as React from "react"
import { generateListeningScriptAction, analyzeDictationAction } from "./actions"
import { BackBtn } from "@/components/ui/back-btn"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
    Play, Pause, RotateCcw, Settings2, ListMusic, Loader2,
    CheckCircle2, Sparkles, Dices, ChevronDown, Headphones, Mic2, FileText
} from "lucide-react"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// English Topics
const PRESET_TOPICS = [
    "Renting an Apartment",
    "Library Registration",
    "Booking a Hotel",
    "Opening a Bank Account",
    "Travel Agency Inquiry",
    "Gym Membership",
    "Lost and Found",
    "Course Selection"
]

export default function ListeningPage() {
    // --- State ---
    const [status, setStatus] = React.useState<'idle' | 'generating' | 'ready'>('idle')
    const [material, setMaterial] = React.useState<any>(null)

    // Playback State
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [currentLineIndex, setCurrentLineIndex] = React.useState(0)

    // User Input & Result
    const [text, setText] = React.useState("")
    const [isTypingMode, setIsTypingMode] = React.useState(true)
    const [result, setResult] = React.useState<any>(null)
    const [isChecking, setIsChecking] = React.useState(false)

    // Speech Synthesis Refs
    const synthRef = React.useRef<SpeechSynthesis | null>(null)
    const voicesRef = React.useRef<SpeechSynthesisVoice[]>([])

    // Init Speech Engine
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis
            const loadVoices = () => {
                voicesRef.current = window.speechSynthesis.getVoices()
            }
            loadVoices()
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices
            }
        }
    }, [])

    // 1. Generate Script
    const handleGenerate = async (topic?: string) => {
        if (status === 'generating') return
        setStatus('generating')
        setResult(null)
        setText("")
        setCurrentLineIndex(0)

        synthRef.current?.cancel()

        toast.info("AI is writing the script...")
        const res = await generateListeningScriptAction(topic)

        if (res.success) {
            setMaterial(res.data)
            setStatus('ready')
            toast.success("Script Ready! Press Play.")
        } else {
            toast.error("Generation failed. Please try again.")
            setStatus('idle')
        }
    }

    // 2. Speech Logic
    const speakScript = React.useCallback((startIndex = 0) => {
        if (!synthRef.current || !material) return

        setIsPlaying(true)
        synthRef.current.cancel()

        const scriptToPlay = material.script.slice(startIndex)

        scriptToPlay.forEach((line: any, index: number) => {
            const utterance = new SpeechSynthesisUtterance(line.text)
            utterance.rate = 0.9

            const allVoices = voicesRef.current
            let selectedVoice = null

            // Smart Casting
            if (line.speaker === 'Man') {
                selectedVoice = allVoices.find(v => v.name.includes("Daniel")) ||
                    allVoices.find(v => v.name.includes("Male"))
            } else {
                selectedVoice = allVoices.find(v => v.name.includes("Samantha")) ||
                    allVoices.find(v => v.name.includes("Female"))
            }
            if (selectedVoice) utterance.voice = selectedVoice

            utterance.onstart = () => {
                setCurrentLineIndex(startIndex + index)
            }

            if (index === scriptToPlay.length - 1) {
                utterance.onend = () => setIsPlaying(false)
            }

            synthRef.current?.speak(utterance)
        })

    }, [material])

    // 3. Controls
    const togglePlay = () => {
        if (!synthRef.current) return
        if (isPlaying) {
            synthRef.current.cancel()
            setIsPlaying(false)
        } else {
            speakScript(currentLineIndex)
        }
    }

    // 4. Smart Pause
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value)
        if (!isTypingMode || !isPlaying) return

        synthRef.current?.cancel()
        setIsPlaying(false)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            speakScript(currentLineIndex)
        }, 1200)
    }

    // 5. Submit Check
    const handleSubmit = async () => {
        if (!material || !text) return
        setIsChecking(true)
        const originalText = material.script.map((s: any) => s.text).join(" ")
        const res = await analyzeDictationAction(originalText, text)
        if (res.success) setResult(res.data)
        setIsChecking(false)
    }

    const progressPercent = material ? ((currentLineIndex + 1) / material.script.length) * 100 : 0

    return (
        <div className="flex flex-col h-screen bg-[#F5F5F7] dark:bg-black overflow-hidden font-sans transition-colors duration-500">

            {/* Top Bar */}
            <div className="flex-none px-4 md:px-6 py-3 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-20">
                <BackBtn label="Back" />

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => handleGenerate()}
                        disabled={status === 'generating'}
                        className="rounded-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black shadow-md h-9 text-xs md:text-sm px-4"
                    >
                        {status === 'generating' ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Dices className="w-3 h-3 mr-2" />}
                        {status === 'generating' ? "Writing..." : "Random Topic"}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full gap-2 border-dashed h-9 text-xs md:text-sm px-3">
                                <ListMusic className="w-3 h-3 text-zinc-500" />
                                <span className="hidden sm:inline">Select Topic</span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                            {PRESET_TOPICS.map(t => (
                                <DropdownMenuItem key={t} onClick={() => handleGenerate(t)} className="cursor-pointer py-2 text-sm">
                                    {t}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="w-8 md:w-10" />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative p-4 md:p-6">
                <div className="mx-auto max-w-6xl h-full flex flex-col md:flex-row gap-6">

                    {/* Left: Player & Result (Adaptive Height) */}
                    <div className="flex-1 flex flex-col justify-center min-h-[300px] md:min-h-0 relative">

                        {/* State A: Idle */}
                        {!material && !status.includes('generating') && (
                            <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-40 h-full">
                                <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                    <Headphones className="w-8 h-8 text-zinc-400" />
                                </div>
                                <p className="text-sm">Click 'Random Topic' above to start</p>
                            </div>
                        )}

                        {/* State B: Generating */}
                        {status === 'generating' && (
                            <div className="flex flex-col items-center justify-center h-full space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full" />
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg">AI is creating content...</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Writing script & adding details</p>
                                </div>
                            </div>
                        )}

                        {/* State C: Player */}
                        {material && !result && (
                            <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
                                {/* Cover Image */}
                                <div className={`
                                    relative w-full max-w-[280px] aspect-square rounded-[2rem] bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl dark:from-zinc-800 dark:to-zinc-900 border border-white/40 dark:border-zinc-700/50 overflow-hidden transition-transform duration-700 ease-spring
                                    ${isPlaying ? 'scale-100 shadow-purple-500/10' : 'scale-[0.98]'}
                                `}>
                                    <div className="absolute inset-0 flex items-center justify-center text-indigo-200 dark:text-zinc-700">
                                        <Headphones size={100} strokeWidth={0.5} />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/90 to-transparent dark:from-black/80">
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight">
                                            {material.title}
                                        </h2>

                                        {isPlaying && material.script[currentLineIndex] ? (
                                            <div className="mt-2 flex items-center gap-2 animate-pulse">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                                    material.script[currentLineIndex].speaker === 'Man' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                                                )}>
                                                    {material.script[currentLineIndex].speaker}
                                                </span>
                                                <span className="text-xs text-zinc-500">Speaking...</span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-zinc-400">Ready to play</div>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="w-full space-y-4 px-4">
                                    <Slider value={[progressPercent]} max={100} className="pointer-events-none" />
                                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                                        <span>Line {currentLineIndex + 1}</span>
                                        <span>Total {material.script.length}</span>
                                    </div>

                                    <div className="flex justify-center items-center gap-8 pt-2">
                                        <Button variant="ghost" size="icon" onClick={() => speakScript(Math.max(0, currentLineIndex - 1))} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                            <RotateCcw className="w-5 h-5 text-zinc-400" />
                                        </Button>

                                        <Button onClick={togglePlay} className="h-14 w-14 rounded-full bg-zinc-900 text-white hover:scale-105 transition-all shadow-lg dark:bg-white dark:text-black">
                                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                        </Button>

                                        <Button variant="ghost" size="icon" className="opacity-20 cursor-not-allowed">
                                            {/* Spacer */}
                                            <div className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* State D: Result */}
                        {result && (
                            <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-4">
                                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                                            <Sparkles className="w-5 h-5 text-purple-500" /> AI Score
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-purple-600">{result.score}</span>
                                            <span className="text-sm text-zinc-400 font-medium">/ 100</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border border-zinc-100 dark:border-zinc-700/50">
                                        {result.feedback}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Corrections</h4>
                                        {result.corrections?.length > 0 ? result.corrections.map((err: any, i: number) => (
                                            <div key={i} className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                                <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                                                <div>
                                                    <span className="font-bold text-red-700 dark:text-red-400 text-sm block mb-1">
                                                        {err.word || err.original}
                                                    </span>
                                                    <p className="text-xs text-zinc-500 leading-relaxed">{err.explanation}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-4 text-center text-sm text-zinc-500 bg-zinc-50 rounded-xl border border-dashed">
                                                🎉 Excellent! No major spelling errors found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50">
                                    <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => setResult(null)}>
                                        Back to Practice
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Dictation Pad (Flex fill) */}
                    <div className="flex-1 h-[50vh] md:h-auto flex flex-col relative min-h-0">
                        <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex-none px-5 py-3 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Dictation Pad</span>
                                </div>
                                <Button
                                    size="sm" variant="ghost"
                                    onClick={() => setIsTypingMode(!isTypingMode)}
                                    className={cn(
                                        "h-7 text-xs gap-1.5 rounded-lg transition-colors",
                                        isTypingMode ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" : "text-zinc-400 hover:text-zinc-600"
                                    )}
                                >
                                    <Settings2 className="w-3 h-3" />
                                    Smart Pause {isTypingMode ? "On" : "Off"}
                                </Button>
                            </div>

                            {/* Text Area */}
                            <Textarea
                                value={text}
                                onChange={handleTyping}
                                placeholder={status === 'generating' ? "Generating audio..." : "Press play and type what you hear..."}
                                className="flex-1 w-full resize-none border-0 p-6 text-lg leading-relaxed bg-transparent focus-visible:ring-0 font-serif placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                spellCheck={false}
                            />

                            {/* Footer */}
                            <div className="flex-none p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/30">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isChecking || !text || !material}
                                    className="rounded-full px-6 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all"
                                >
                                    {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Check
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}