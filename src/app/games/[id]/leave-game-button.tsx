"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Game } from "@/db/schemas/games"
import { PlayerSchema } from "@/db/schemas/players"
import { Profile } from "@/db/schemas/profiles"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { leaveGame } from "./leave-game"

const formSchema = PlayerSchema.pick({ game_id: true })

export function LeaveGameButton({
  game,
  host_id,
  user_id,
}: {
  game: Game
  host_id: Profile["id"]
  user_id: Profile["id"]
}) {
  const router = useRouter()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" variant="destructive" type="submit">
          Leave Game
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {user_id === host_id
              ? "You are the host of this game. If you leave, a new random host will be chosen."
              : "You are about to leave this game."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="lg"
              variant="destructive"
              onClick={async () => {
                const result = await leaveGame({ id: game.id })
                if (!result) {
                  return
                }
                if (result.serverError) {
                  toast.error(result.serverError)
                  return
                }
                if (result.data) {
                  toast.success("You have left the game")
                  router.push("/games")
                }
              }}>
              Leave Game
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
