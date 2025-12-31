"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, BookOpen, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

interface ArticleViewerProps {
    content: string
}

export function ArticleViewer({ content }: ArticleViewerProps) {
    const [selection, setSelection] = React.useState<{ text: string, x: number, y: number } | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // 核心：监听鼠标抬起事件，获取选区
    React.useEffect(() => {
        const handleMouseUp = () => {
            const sel = window.getSelection()
            if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                setSelection(null)
                return
            }

            const text = sel.toString().trim()
            // 限制太长的选中 (防止误触选一段)
            if (text.split(' ').length > 3) {
                setSelection(null)
                return
            }

            const range = sel.getRangeAt(0)
            const rect = range.getBoundingClientRect()

            // 计算相对于 viewport 的位置，考虑到滚动
            // 这里我们在 fixed 定位的层里显示 popover，所以直接用 rect
            setSelection({
                text,
                x: rect.left + rect.width / 2, // 居中
                y: rect.top - 10 // 显示在上方
            })
        }

        // 绑定到 document 此时更稳妥，或者绑定到 containerRef
        document.addEventListener("mouseup", handleMouseUp)
        return () => document.removeEventListener("mouseup", handleMouseUp)
    }, [])

    // 添加到生词本
    const addToVocab = async () => {
        if (!selection) return
        setIsSaving(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Please login to save words")
            setIsSaving(false)
            return
        }

        const { error } = await supabase.from('vocab_book').insert({
            user_id: user.id,
            word: selection.text,
            context: "From Reading", // 这里以后可以存整句
        })

        if (error) {
            toast.error("Failed to add word")
        } else {
            toast.success(`Added "${selection.text}" to Vocabulary`)
            setSelection(null) // 关闭菜单
            window.getSelection()?.removeAllRanges() // 清除高亮
        }
        setIsSaving(false)
    }

    return (
        <>
            {/* 悬浮菜单 (Floating Menu) */}
            <AnimatePresence>
                {selection && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            left: selection.x,
                            top: selection.y,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 50
                        }}
                        className="mb-2"
                    >
                        <button
                            onClick={addToVocab}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all dark:bg-white dark:text-black"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            <span className="text-sm font-medium">Add "{selection.text}"</span>
                        </button>
                        {/* 小三角 */}
                        <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-zinc-900 dark:bg-white rotate-45 -translate-x-1/2" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 文章内容 */}
            <article
                ref={containerRef}
                className="prose prose-zinc prose-lg dark:prose-invert max-w-none 
        font-serif 
        prose-headings:font-sans prose-headings:font-bold 
        prose-p:leading-8 prose-p:text-zinc-600 dark:prose-p:text-zinc-300
        selection:bg-emerald-200 selection:text-emerald-900 dark:selection:bg-emerald-900 dark:selection:text-emerald-100"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </>
    )
}