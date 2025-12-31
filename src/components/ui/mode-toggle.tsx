/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {

    const { setTheme, theme, resolvedTheme } = useTheme()


    const toggleTheme = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {

        const newTheme = resolvedTheme === "dark" ? "light" : "dark";



        if (!(document as any).startViewTransition) {
            setTheme(newTheme);
            return;
        }


        const x = event.clientX;
        const y = event.clientY;


        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );


        document.documentElement.style.setProperty('--transition-x', `${x}px`);
        document.documentElement.style.setProperty('--transition-y', `${y}px`);
        document.documentElement.style.setProperty('--transition-r', `${endRadius}px`);



        const transition = (document as any).startViewTransition(() => {
            setTheme(newTheme);
        });


        transition.finished.then(() => {
            document.documentElement.style.removeProperty('--transition-x');
            document.documentElement.style.removeProperty('--transition-y');
            document.documentElement.style.removeProperty('--transition-r');
        })

    }, [setTheme, resolvedTheme]);

    return (
        <Button
            variant="outline"
            size="icon"

            onClick={toggleTheme}
            className="rounded-full bg-white/50 backdrop-blur-md border-zinc-200 dark:bg-black/50 dark:border-zinc-800 transition-transform hover:scale-105 relative overflow-hidden"
        >
            {/* 图标动画保持不变 */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}