import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { getUserStreak } from "@/app/actions/streak";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { DashboardStreakCard } from "@/components/dashboard-streak-card";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import Link from "next/link";
import {
    BookOpen, Headphones, PenTool, Mic, LogOut, ArrowUpRight,
    Sun as SunIcon, Sparkles, BarChart3, TrendingUp, Type
} from "lucide-react";

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const username = user.email?.split('@')[0] || "Friend";

    // 1. 获取真实数据
    // 单词数
    const { count: vocabCount, error: vocabError } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
    const safeVocabCount = vocabError ? 0 : (vocabCount || 0);

    // 作文数
    const { count: essayCount } = await supabase
        .from('writing_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // 总字数
    const { data: essays } = await supabase
        .from('writing_submissions')
        .select('word_count')
        .eq('user_id', user.id);
    const totalWords = essays?.reduce((acc, curr) => acc + (curr.word_count || 0), 0) || 0;

    // 打卡数据
    const { streak, checkedIn } = await getUserStreak();

    // 2. 时间逻辑
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const hour = today.getHours();
    let greeting = "Good Morning";
    if (hour >= 12) greeting = "Good Afternoon";
    if (hour >= 18) greeting = "Good Evening";

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F5F7] dark:bg-[#050505] transition-colors duration-500">

            {/* 背景光效 */}
            <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[120px] pointer-events-none dark:bg-purple-900/10" />
            <div className="fixed top-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none dark:bg-blue-900/10" />

            <div className="relative mx-auto max-w-6xl p-6 md:p-10 space-y-10 z-10">

                {/* Header */}
                <header className="flex items-center justify-between animate-in fade-in slide-in-from-top-5 duration-700">
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{dateStr}</span>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
                                {greeting}, {username}
                            </h1>
                            {hour < 12 && <SunIcon className="h-6 w-6 text-amber-500 animate-spin-slow" />}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle />
                        <form action={signOut}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-500 transition-transform hover:rotate-90">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </header>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* 1. Daily Focus (橙色卡片) */}
                    <div className="md:col-span-8 animate-in fade-in zoom-in duration-500 delay-100">
                        <SpotlightCard
                            className="group h-full rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50 p-8 md:p-10 shadow-sm border border-orange-100/50 dark:from-[#1a1a1a] dark:to-[#121212] dark:border-zinc-800 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1"
                            spotlightColor="rgba(249, 115, 22, 0.2)" // 增强光效
                        >
                            <div className="absolute top-[-20px] right-[-20px] p-10 opacity-10 dark:opacity-5 transition-transform duration-700 ease-out group-hover:rotate-[20deg] group-hover:scale-110">
                                <SunIcon size={180} className="text-orange-500" />
                            </div>

                            <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/80 text-xs font-bold uppercase tracking-wider text-orange-700 backdrop-blur-md shadow-sm dark:bg-orange-500/10 dark:text-orange-400">
                                            <Sparkles className="w-3 h-3" /> Today's Goal
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                                        Start your <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-300">
                                            Daily Practice
                                        </span>
                                    </h2>
                                    <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                        Pick a module below to start your IELTS journey today.
                                    </p>
                                </div>
                                <Link href="/writing" className="w-fit">
                                    <Button className="h-14 rounded-full bg-zinc-900 px-8 text-lg font-medium shadow-lg shadow-zinc-900/20 transition-all hover:scale-105 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                                        Go to Writing <ArrowUpRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </SpotlightCard>
                    </div>

                    {/* 2. Streak Card (打卡) */}
                    <div className="md:col-span-4 animate-in fade-in zoom-in duration-500 delay-200">
                        <SpotlightCard
                            className="h-full rounded-[2.5rem] bg-white p-1 shadow-sm border border-zinc-100 dark:bg-[#121212] dark:border-zinc-800 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                            spotlightColor="rgba(59, 130, 246, 0.15)" // 这里的白色背景光效要加深
                        >
                            <div className="h-full w-full rounded-[2.3rem] overflow-hidden">
                                <DashboardStreakCard initialStreak={streak} initialChecked={checkedIn} />
                            </div>
                        </SpotlightCard>
                    </div>

                    {/* 3. Navigation Deck (功能入口) */}
                    <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                        <ModuleBtn
                            icon={<Headphones className="w-6 h-6" />}
                            label="Listening"
                            color="text-blue-800 bg-blue-50 dark:bg-blue-900/100 dark:text-blue-300"
                            sub="Part 1-4"
                            href="/listening"
                        />
                        <ModuleBtn
                            icon={<BookOpen className="w-6 h-6" />}
                            label="Reading"
                            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/100 dark:text-emerald-300"
                            sub="G-Training"
                            href="/reading"
                        />
                        <ModuleBtn
                            icon={<PenTool className="w-6 h-6" />}
                            label="Writing"
                            color="text-purple-600 bg-purple-50 dark:bg-purple-900/100 dark:text-purple-300"
                            sub="Letters & Essays"
                            href="/writing"
                        />
                        <ModuleBtn
                            icon={<Mic className="w-6 h-6" />}
                            label="Speaking"
                            color="text-rose-600 bg-rose-50 dark:bg-rose-900/100 dark:text-rose-300"
                            sub="AI Partner"
                            href="/speaking"
                        />
                    </div>

                    {/* 4. Vocabulary (单词) */}
                    <div className="md:col-span-5 animate-in fade-in zoom-in duration-500 delay-400">
                        <Link href="/vocabulary" className="h-full block">
                            <SpotlightCard
                                className="group h-full rounded-[2.5rem] bg-indigo-600 p-8 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1"
                                spotlightColor="rgba(255, 255, 255, 0.3)"
                            >
                                <div className="flex h-full flex-col justify-between text-white relative z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="h-12 w-12 flex items-center justify-center bg-white/20 rounded-2xl backdrop-blur-md transition-transform group-hover:scale-110 group-hover:rotate-3">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </div>

                                    <div className="space-y-1 mt-8">
                                        <h3 className="font-bold text-3xl tracking-tight">{safeVocabCount}</h3>
                                        <p className="text-indigo-100 text-sm font-medium">
                                            Words Collected
                                        </p>
                                    </div>
                                </div>
                                <BookOpen className="absolute -bottom-6 -right-6 w-40 h-40 text-white/10 rotate-12 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110" />
                            </SpotlightCard>
                        </Link>
                    </div>

                    {/* 5. Real Stats (统计) */}
                    <div className="md:col-span-7 animate-in fade-in zoom-in duration-500 delay-500">
                        <SpotlightCard
                            className="h-full rounded-[2.5rem] bg-[#1c1c1e] p-8 text-white shadow-lg dark:bg-[#18181b] hover:shadow-2xl hover:-translate-y-1"
                            spotlightColor="rgba(255, 255, 255, 0.15)"
                        >
                            <div className="flex h-full flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                                        <BarChart3 className="h-6 w-6 text-zinc-400" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500">LIFETIME STATS</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-8">
                                    <div className="group/stat">
                                        <div className="text-3xl font-bold text-white group-hover/stat:text-blue-400 transition-colors">
                                            {essayCount || 0}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                            <PenTool className="w-3 h-3" /> Essays
                                        </div>
                                    </div>
                                    <div className="group/stat">
                                        <div className="text-3xl font-bold text-emerald-400 group-hover/stat:text-emerald-300 transition-colors">
                                            {totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                            <Type className="w-3 h-3" /> Words
                                        </div>
                                    </div>
                                    <div className="group/stat">
                                        <div className="text-3xl font-bold text-purple-400 group-hover/stat:text-purple-300 transition-colors">
                                            {safeVocabCount}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Vocab
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Module Button 组件
function ModuleBtn({
    icon,
    label,
    color,
    sub,
    href = "#"
}: {
    icon: any,
    label: string,
    color: string,
    sub: string,
    href?: string
}) {
    return (
        <Link href={href} className="block h-full group">
            <SpotlightCard
                className="h-full flex flex-col justify-between rounded-[2rem] p-6 bg-white border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1 hover:border-zinc-200 dark:bg-[#121212] dark:border-zinc-800 dark:hover:shadow-none dark:hover:bg-zinc-900"
                spotlightColor="rgba(0,0,0,0.1)" 
            >
                <div className="flex justify-between items-start">
                    <div className={`
                        flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
                        ${color}
                    `}>
                        {icon}
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-zinc-300 opacity-50 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 dark:text-zinc-600" />
                </div>

                <div className="space-y-1 mt-4">
                    <span className="block text-lg font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {label}
                    </span>
                    <span className="block text-xs font-medium text-zinc-400 group-hover:text-zinc-500 transition-colors">
                        {sub}
                    </span>
                </div>
            </SpotlightCard>
        </Link>
    )
}