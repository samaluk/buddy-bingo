import { db } from "@/db"
import { games } from "@/db/schemas/games"
import { getUser } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { DraftGame } from "./draft-game"
import { LeaveGameButton } from "./leave-game-button"

export default async function Page({ params }: { params: { id: string } }) {
  let numId
  try {
    numId = parseInt(params.id)
  } catch (error) {
    return <div>Invalid ID</div>
  }
  const user = await getUser()

  const game = await db.query.games.findFirst({
    where: eq(games.id, numId),
    with: {
      players: {
        columns: {
          user_id: true,
          role: true,
          username: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  })

  if (!game) {
    return <div>Game not found</div>
  }

  const host = game.players.find((p) => p.role === "host")
  if (!host) {
    return <div>Host not found</div>
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col justify-start">
      {game.status === "draft" && <DraftGame game={game} />}
      <LeaveGameButton game={game} host_id={host.user_id} user_id={user.id} />
    </div>
  )
}
