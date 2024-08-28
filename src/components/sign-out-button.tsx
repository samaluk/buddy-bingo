"use client"

import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Button, ButtonProps } from "./ui/button"

import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function SignOutButton({ className }: ButtonProps) {
  const supabase = createClient()
  const router = useRouter()

  const handleClick = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
    toast.success("Succesfully signed out.")
    router.push("/")
  }

  return (
    <Button
      variant="outline"
      className={cn("block w-full text-left", className)}
      onClick={handleClick}>
      Sign out
    </Button>
  )
}
