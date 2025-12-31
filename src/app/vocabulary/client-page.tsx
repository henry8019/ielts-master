"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Volume2, Search, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Word {
    id: string
    word: string
    translation?: string
    context?: string
    created_at: string
}

export function VocabList({ initialWords }: { initialWords: any[] }) {
    const [words, setWords] = React.useState<Word[]>(initialWords)
    const [filter, setFilter] = React.useState("")
    const supabase = createClient()

    // 简单的删除逻辑
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // 防止触发卡片点击

        // 乐观更新 UI
        setWords(words.filter(w => w.id !== id))
        toast.success("Word removed")

        const { error } = await supabase.from('vocab_book').delete().eq('id', id)
        if (error) {
            toast.error("Failed to delete")
            // 如果失败了再加回来，略
        }
    }

    // 过滤搜索
    const filteredWords = words.filter(w =>
        w.word.toLowerCase().includes(filter.toLowerCase())
    )

    if (words.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <BookOpen className="w-16 h-16 mb-4 text-zinc-300" />
                <h3 className="text-xl font-medium">Your vocab book is empty</h3>
                <p>Go to Reading section and highlight some words!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 搜索框 */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Search your words..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            {/* 单词网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {filteredWords.map((item) => (
                        <WordCard key={item.id} item={item} onDelete={(e) => handleDelete(item.id, e)} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

// 单个单词卡片 (带翻转效果预留)
function WordCard({ item, onDelete }: { item: Word, onDelete: (e: any) => void }) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="group relative cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                        {item.word}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                        Added {new Date(item.created_at).toLocaleDateString()}
                    </p>
                </div>
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-opacity"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* 来源例句 (如果有) */}
            {item.context && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 italic line-clamp-2 text-ellipsis">
                        "{item.context}"
                    </p>
                </div>
            )}

            {/* 这里的翻译目前是空的，以后我们接了 AI 可以自动填入 */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                >
                    <span className="inline-block px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded">
                        Definition
                    </span>
                    <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-300">
                        {item.translation || "No definition yet. (AI feature coming soon)"}
                    </p>
                </motion.div>
            )}
        </motion.div>
    )
}