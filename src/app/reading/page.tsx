import { createClient } from "@/lib/supabase/server"
import { ReadingClient } from "./client-page" // 👈 我们要把之前的客户端逻辑拆出去

// 这是一个 Server Component
export default async function ReadingPage() {
    const supabase = await createClient()

    // 获取第一篇阅读材料 (实际场景可能是根据 ID 获取)
    const { data: article } = await supabase
        .from('reading_materials')
        .select('*')
        .limit(1)
        .single()

    // 如果数据库没数据，给个兜底
    if (!article) {
        return <div className="p-10 text-center">No reading materials found. Please run the SQL seed script.</div>
    }

    return <ReadingClient article={article} />
}