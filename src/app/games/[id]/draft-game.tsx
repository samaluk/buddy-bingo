import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/db"
import { Game, games, GameSchema } from "@/db/schemas/games"
import { players } from "@/db/schemas/players"
import { NewStatementSchema, statements } from "@/db/schemas/statements"
import { getUser } from "@/lib/auth"
import { and, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { RealtimePlayers } from "./realtime-players"
import { RealtimeStatements } from "./realtime-statements"

type DraftGameProps = {
  game: Game
}

export async function DraftGame({ game }: DraftGameProps) {
  const user = await getUser()

  const DBstatements = await db.query.statements.findMany({
    where: eq(statements.game_id, game.id),
    with: { votes: true },
  })

  const DBplayers = await db.query.players.findMany({
    where: and(eq(players.game_id, game.id), isNull(players.deleted_at)),
  })

  const player = DBplayers.find((p) => p.user_id === user.id)
  if (!player) {
    redirect(`/games`)
  }

  const host = DBplayers.find((p) => p.role === "host")
  if (!host) {
    redirect(`/games`)
  }

  async function createStatement(formData: FormData) {
    "use server"
    const data = Object.fromEntries(formData)
    console.log(data)
    const parsed = NewStatementSchema.safeParse(data)
    console.log(
      parsed.error?.issues.map((issue) => `${issue.path}: ${issue.message}`),
    )
    if (!parsed.success) {
      const fields: Record<string, string> = {}
      for (const key of Object.keys(formData)) {
        fields[key] = data[key].toString()
      }
      return {
        message: "Invalid form data",
        fields,
        issues: parsed.error.issues.map((issue) => issue.message),
      }
    }

    // check if statement already exists
    const statement = await db.query.statements.findFirst({
      where: and(
        eq(statements.game_id, parsed.data.game_id),
        eq(statements.text, parsed.data.text),
      ),
    })
    if (statement) {
      return {
        message: "Statement already exists",
      }
    }

    await db.insert(statements).values(parsed.data)
  }

  async function startGame(formData: FormData) {
    "use server"

    const data = Object.fromEntries(formData)

    const parsed = GameSchema.pick({
      id: true,
    }).safeParse(data)

    if (!parsed.success) {
      return {
        message: "Invalid form data",
        issues: parsed.error.issues.map((issue) => issue.message),
      }
    }

    const player = await db.query.players.findFirst({
      where: eq(players.game_id, parsed.data.id),
      with: {
        game: {
          columns: {
            id: true,
            status: true,
          },
          with: {
            statements: true,
          },
        },
      },
    })

    if (!player) {
      return {
        message: "Player not found",
      }
    }

    if (player.role !== "host") {
      return {
        message: "Only the host can start the game",
      }
    }

    if (player.game.status !== "draft") {
      return {
        message: "Game is not in draft",
      }
    }

    if (player.game.statements.length < 25) {
      throw new Error("Game must have at least 25 statements to start")
    }

    await db
      .update(games)
      .set({ status: "playing" })
      .where(eq(games.id, parsed.data.id))

    // generate boards for every player
    const playersInGame = await db.query.players.findMany({
      where: eq(players.game_id, parsed.data.id),
    })

    for (const player of playersInGame) {
      // await db.insert(boards).values({
      //   player_id: player.id,
      //   game_id: parsed.data.id,
      // })
    }

    revalidatePath(`/games/${parsed.data.id}`)
  }

  return (
    <>
      <Card>
        <Tabs defaultValue="statements" className="w-full">
          <CardHeader>
            <TabsList className="justify-evenly">
              <TabsTrigger className="w-full" value="game">
                Game
              </TabsTrigger>
              <TabsTrigger className="w-full" value="statements">
                Statements
              </TabsTrigger>
              <TabsTrigger className="w-full" value="players">
                Players
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="game">
              <h1>Game: {game.title}</h1>
              <p>Status: {game.status}</p>
              <p>Host: {host.username}</p>
            </TabsContent>
            <TabsContent value="statements">
              <RealtimeStatements
                player_id={player.user_id}
                gameId={game.id}
                serverStatements={DBstatements}
                players={DBplayers}
              />
              <form action={createStatement} className="flex flex-col gap-2">
                <input type="hidden" name="game_id" value={game.id} />
                <input type="hidden" name="created_by" value={user.id} />
                <Input
                  type="text"
                  name="text"
                  placeholder="Enter a statement"
                  required
                />
                <Button>Submit</Button>
              </form>
            </TabsContent>
            <TabsContent value="players">
              <RealtimePlayers gameId={game.id} serverPlayers={DBplayers} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {player.user_id === host.user_id && (
        <form
          action={startGame}
          className="flex flex-col items-center justify-center">
          <input type="hidden" name="id" value={game.id} />
          <input type="hidden" name="host" value={user.id} />
          <Button variant="confirmation" size="lg">
            Start Game
          </Button>
        </form>
      )}
    </>
  )
}
