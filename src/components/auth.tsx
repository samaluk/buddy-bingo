"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getURL } from "@/lib/get-url"
import { createClient } from "@/utils/supabase/client"

export function LoginForm() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getURL(),
        skipBrowserRedirect: false,
      },
    })
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Button
            variant="default"
            className="w-full"
            onClick={handleGoogleLogin}>
            Login with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
