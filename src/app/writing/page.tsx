import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WritingManager } from "./client-page" // 👈 引入新的管理器

export default async function WritingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    return <WritingManager user={user} />
}