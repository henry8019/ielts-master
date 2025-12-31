"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function BackBtn({ label = "Back" }: { label?: string }) {
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            onClick={() => router.back()}
        >
            <ChevronLeft className="mr-1 h-5 w-5" />
            <span className="text-base font-medium">{label}</span>
        </Button>
    )
}