'use server'

import { revalidatePath } from "next/cache"
import { getServerSession, getServerSupabaseClient } from "@/lib/supabase/server"

export type UpdateProfileResult = {
  success: boolean
  message: string
}



export async function updateProfile(formData: FormData | null): Promise<UpdateProfileResult> {
  const supabase = await getServerSupabaseClient()
  const session = await getServerSession()
  if (!session) {
    return { success: false, message: "Not authenticated" }
  }

  if (!formData) {
    return { success: false, message: "No form data provided" }
  }

  const full_name = String(formData.get("full_name") ?? "").trim()
  const zip = String(formData.get("zip") ?? "").trim()
  const timezone = String(formData.get("timezone") ?? "").trim()

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name,
      zip,
      timezone,
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  // Refresh Settings page and headers that render user info
  revalidatePath("/settings")
  revalidatePath("/dashboard")

  return { success: true, message: "Profile updated" }
}


