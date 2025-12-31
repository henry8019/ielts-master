// src/app/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#F5F5F7] dark:bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-400 animate-pulse">Loading...</p>
            </div>
        </div>
    );
}