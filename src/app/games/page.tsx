import { Button } from "@/components/ui/button"
import { db } from "@/db"
import { players } from "@/db/schemas/players"
import { getUser } from "@/lib/auth"
import { isNull } from "drizzle-orm"
import Link from "next/link"
import JoinGameButton from "./join-game-button"

export default async function Page() {
  const user = await getUser()

  const games = await db.query.games.findMany({
    with: {
      players: {
        where: isNull(players.deleted_at),
      },
    },
  })

  return (
    <div className="container">
      <div className="flex justify-between pb-5">
        <h1 className="text-2xl">Games</h1>
        <Button>
          <Link href="/games/new">New</Link>
        </Button>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Players</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => {
            const userHasJoined = game.players.some(
              (player) => player.user_id === user.id,
            )

            return (
              <tr key={game.id}>
                <td>{game.title}</td>
                <td>{game.players.length}</td>
                <td>
                  {userHasJoined ? (
                    <Button size="lg">
                      <Link href={`/games/${game.id}`}>Open</Link>
                    </Button>
                  ) : (
                    <JoinGameButton game_id={game.id} />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
