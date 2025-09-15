import { db } from "@/db"
import { players } from "@/db/schemas/players"
import { getUser } from "@/lib/auth"
import { and, eq, isNull } from "drizzle-orm"

export default async function Page() {
  const user = await getUser()

  const DBplayers = await db.query.players.findMany({
    where: and(eq(players.user_id, user.id), isNull(players.deleted_at)),
    columns: {
      game_id: false,
    },
    with: {
      game: {
        columns: {
          id: true,
          title: true,
        },
      },
    },
  })

  const joinedGames = DBplayers.map((player) => player.game)
  const playersHosting = await DBplayers.filter(
    (player) => player.role === "host",
  )
  return (
    <div>
      <h2>My Games</h2>
      <ul>
        {playersHosting.map((player) => (
          <li key={player.game.id}>
            <a href={`/games/${player.game.id}`}>{player.game.title}</a>
          </li>
        ))}
      </ul>
      <h2>Joined games</h2>
      <ul>
        {joinedGames.map((game) => (
          <li key={game.id}>
            <a href={`/games/${game.id}`}>{game.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
