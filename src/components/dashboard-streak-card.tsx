"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Flame, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { checkInAction } from "@/app/actions/streak"
import { toast } from "sonner"

interface Props {
    initialStreak?: number
    initialChecked?: boolean
}

export function DashboardStreakCard({ initialStreak = 0, initialChecked = false }: Props) {
    const [streak, setStreak] = React.useState(initialStreak)
    const [checked, setChecked] = React.useState(initialChecked)
    const [loading, setLoading] = React.useState(false)

    // 礼花特效函数
    const triggerConfetti = () => {
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            // 左右两边喷射
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)
    }

    const handleCheckIn = async () => {
        if (checked || loading) return

        setLoading(true)

        // 乐观更新 (Optimistic Update) - 先让用户爽
        setChecked(true)
        setStreak(prev => prev + 1)
        triggerConfetti() // 🎉 放烟花！

        // 后台提交
        const res = await checkInAction()

        if (!res.success) {
            // 失败回滚
            setChecked(false)
            setStreak(prev => prev - 1)
            toast.error("Check-in failed. Network issue?")
        }

        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center h-full w-full py-4 space-y-6">

            {/* 顶部：天数展示 */}
            <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm font-bold uppercase tracking-wider">
                    <Flame className={cn("w-4 h-4", checked ? "text-orange-500 fill-orange-500" : "text-zinc-300")} />
                    Current Streak
                </div>
                <div className="text-6xl md:text-7xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight">
                    {streak} <span className="text-2xl font-bold text-zinc-400">days</span>
                </div>
            </div>

            {/* 底部：打卡按钮 */}
            <Button
                onClick={handleCheckIn}
                disabled={checked || loading}
                className={cn(
                    "w-full max-w-[200px] h-14 rounded-full text-lg font-bold transition-all duration-500 shadow-lg",
                    checked
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white hover:scale-105 shadow-zinc-900/20 dark:bg-white dark:text-black"
                )}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : checked ? (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Done for Today</>
                ) : (
                    "Check In Now"
                )}
            </Button>

            {/* 底部小字提示 */}
            {!checked && (
                <p className="text-xs text-zinc-400 animate-pulse">
                    Don't break the chain!
                </p>
            )}
        </div>
    )
}