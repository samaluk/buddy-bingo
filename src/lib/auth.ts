import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function getUser() {
  const supabase = createClient()
  const { data: supabaseData } = await supabase.auth.getUser()
  if (!supabaseData.user) {
    redirect("/login")
  }
  return supabaseData.user
}
