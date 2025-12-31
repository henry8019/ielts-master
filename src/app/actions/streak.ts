"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getUserStreak() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { streak: 0, checkedIn: false }

  const { data } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) return { streak: 0, checkedIn: false }

  // 检查最后打卡时间是否是今天 (UTC时间简单处理，或者根据你的需求改为本地时间)
  // 这里做一个简单的日期字符串比对
  const today = new Date().toISOString().split('T')[0]
  const lastCheckIn = data.last_check_in_date

  return {
    streak: data.current_streak,
    checkedIn: lastCheckIn === today
  }
}

export async function checkInAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // 获取当前记录
  const { data: record } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  
  // 计算昨天
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toISOString().split('T')[0]

  let newStreak = 1

  if (record) {
    // 如果今天已经打过卡了
    if (record.last_check_in_date === today) {
        return { success: true, streak: record.current_streak }
    }
    // 如果上次打卡是昨天，续火
    if (record.last_check_in_date === yesterday) {
        newStreak = record.current_streak + 1
    }
    // 如果上次打卡更早，重置为 1 (newStreak 默认就是 1)
  }

  // 更新或插入
  const { error } = await supabase
    .from('user_streaks')
    .upsert({
        user_id: user.id,
        current_streak: newStreak,
        last_check_in_date: today,
        updated_at: new Date().toISOString()
    })

  if (error) return { success: false }

  revalidatePath("/") // 刷新页面数据
  return { success: true, streak: newStreak }
}