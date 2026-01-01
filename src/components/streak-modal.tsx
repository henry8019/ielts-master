"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isToday } from "date-fns"
import { X, Flame, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 👇 修改接口：接收真实数据
interface StreakModalProps {
    isOpen: boolean
    onClose: () => void
    streakDays: number
    isCheckedToday: boolean
    onCheckIn: () => void
}

export function StreakModal({ isOpen, onClose, streakDays, isCheckedToday, onCheckIn }: StreakModalProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())

    // 生成当月网格
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    })

    // 简单的震动反馈封装
    const handlePress = () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50)
        onCheckIn()
    }

    const springConfig = { type: "spring" as const, stiffness: 300, damping: 20 }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 100 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 100 }}
                            transition={springConfig}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >

                            {/* Header */}
                            <div className="relative h-32 bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center text-white">
                                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors">
                                    <X className="w-4 h-4 text-white" />
                                </button>

                                <motion.div
                                    key={isCheckedToday ? "checked" : "unchecked"}
                                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                    className="p-3 bg-white/20 rounded-full backdrop-blur-md mb-1"
                                >
                                    <Flame className={cn("w-8 h-8 fill-white", isCheckedToday && "animate-pulse")} />
                                </motion.div>
                                {/* 👇 使用真实数据 */}
                                <h2 className="text-3xl font-bold">{streakDays}</h2>
                                <p className="text-xs font-medium text-orange-100 uppercase tracking-wider">Day Streak</p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-center px-2">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{format(currentMonth, "MMMM yyyy")}</span>
                                </div>

                                <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                        <div key={i} className="text-[10px] font-bold text-zinc-400">{d}</div>
                                    ))}
                                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                    {daysInMonth.map((day, i) => {
                                        const isTodayDate = isToday(day)
                                        const showGreen = isTodayDate && isCheckedToday;

                                        return (
                                            <div key={i} className="flex justify-center">
                                                <div className={cn(
                                                    "relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                                    showGreen
                                                        ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                                                        : isTodayDate
                                                            ? "bg-zinc-100 text-zinc-900 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-white dark:ring-zinc-600"
                                                            : "text-zinc-400"
                                                )}>
                                                    {format(day, "d")}
                                                    {showGreen && (
                                                        <motion.div
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center"
                                                        >
                                                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <Button
                                    onClick={handlePress}
                                    disabled={isCheckedToday}
                                    className={cn(
                                        "w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95",
                                        isCheckedToday
                                            ? "bg-zinc-100 text-zinc-400 hover:bg-zinc-100 shadow-none dark:bg-zinc-800 dark:text-zinc-500"
                                            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
                                    )}
                                >
                                    {isCheckedToday ? "Good Job!" : "Check In"}
                                </Button>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}