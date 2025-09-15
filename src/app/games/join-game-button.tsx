"use client"

import { NewPlayer, NewPlayerSchema } from "@/db/schemas/players"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { joinGame } from "./join-game"

const formSchema = NewPlayerSchema.pick({ game_id: true })

export default function JoinGameButton({
  game_id,
}: {
  game_id: NewPlayer["game_id"]
}) {
  const router = useRouter()

  const { form, handleSubmitWithAction } = useHookFormAction(
    joinGame,
    zodResolver(formSchema),
    {
      actionProps: {
        onSuccess: (result) => {
          toast.success(result.data?.message)
          router.push(`/games/${game_id}`)
        },
        onError: (error) => {
          toast.error("wtf")
        },
      },
      formProps: {
        defaultValues: {
          game_id,
        },
      },
    },
  )

  useEffect(() => {
    console.log("form", form.formState.errors)
  }, [form.formState.errors])

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction}>
        <FormField
          control={form.control}
          name="game_id"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button size="lg" type="submit">
          Join
        </Button>
      </form>
    </Form>
  )
}
