import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VocabList } from "./client-page"
import { BackBtn } from "@/components/ui/back-btn"

export default async function VocabularyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: words } = await supabase
        .from('vocab_book')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-black">
            <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <BackBtn label="Dashboard" />
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Vocabulary</h1>
                        <p className="text-zinc-500">
                            You have collected <span className="font-bold text-indigo-500">{words?.length || 0}</span> words.
                        </p>
                    </div>
                </div>

                {/* Client Component: 单词列表交互 */}
                <VocabList initialWords={words || []} />
            </div>
        </div>
    )
}