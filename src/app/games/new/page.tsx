"use client"

import { NewGameSchema } from "@/db/schemas/games"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createGame } from "./create-game"

const formSchema = NewGameSchema.pick({ title: true })

export default function Page() {
  const router = useRouter()
  const { form, handleSubmitWithAction } = useHookFormAction(
    createGame,
    zodResolver(formSchema),
    {
      actionProps: {
        onSuccess: ({ data }) => {
          if (!data) {
            toast.error("No data")
            return
          }
          toast.success(data.message)
          router.push(`/games/${data.game_id}`)
        },
      },
      formProps: {
        values: {
          title: "",
        },
      },
    },
  )

  return (
    <div className="container space-y-8">
      <h1 className="text-2xl">New Game</h1>
      <Form {...form}>
        <form className="space-y-8" onSubmit={handleSubmitWithAction}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  )
}
