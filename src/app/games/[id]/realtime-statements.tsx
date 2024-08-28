"use client"

import { Button } from "@/components/ui/button"
import { Game } from "@/db/schemas/games"
import { Player } from "@/db/schemas/players"
import { Statement, StatementSchema } from "@/db/schemas/statements"
import { Vote, VoteSchema } from "@/db/schemas/votes"
import { createClient } from "@/utils/supabase/client"
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { clearVote, vote } from "./vote"

type StatementWithVotesPlayers = Statement & { votes: Vote[] }
const StatementWithVotesSchema = StatementSchema.extend({
  votes: z.array(VoteSchema),
})

const formSchema = VoteSchema.pick({ statement_id: true, vote: true })

export function RealtimeStatements({
  player_id,
  gameId,
  players,
  serverStatements,
}: {
  player_id: Player["user_id"]
  gameId: Game["id"]
  players: Player[]
  serverStatements: StatementWithVotesPlayers[]
}) {
  const [statements, setStatements] =
    useState<StatementWithVotesPlayers[]>(serverStatements)

  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel("realtime-statements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "statements",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          console.log(payload.new)
          const parsed = StatementWithVotesSchema.omit({
            votes: true,
          }).safeParse(payload.new)
          if (!parsed.success) {
            console.error("Invalid statement", parsed.error)
            return
          }
          const newData = { ...parsed.data, votes: [] }

          setStatements((prev) => [...prev, newData])
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "statements",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const parsedStatement = StatementSchema.safeParse(payload.old)
          if (!parsedStatement.success) {
            console.error("Invalid statement", parsedStatement.error)
            return
          }
          setStatements((prev) =>
            prev.filter(
              (statement) => statement.id !== parsedStatement.data.id,
            ),
          )
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `statement_id=in.(${statements.map((s) => s.id).join(", ")})`,
        },
        (payload) => {
          console.log("VOTE INSERT", payload)
          const parsedVote = VoteSchema.safeParse(payload.new)
          console.log(
            parsedVote.error?.issues.map(
              (issue) => `${issue.path}: ${issue.message}`,
            ),
          )
          if (!parsedVote.success) {
            console.error("Invalid vote", parsedVote.error)
            return
          }
          const statement = statements.find(
            (s) => s.id === parsedVote.data.statement_id,
          )
          if (!statement) {
            console.error("Statement not found", parsedVote.data.statement_id)
            return
          }

          setStatements((prev) =>
            prev.map((s) =>
              s.id === statement.id
                ? {
                    ...s,
                    votes: [...s.votes, parsedVote.data],
                  }
                : s,
            ),
          )
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "votes",
          filter: `statement_id=in.(${statements.map((s) => s.id).join(", ")})`,
        },
        (payload) => {
          console.log("VOTE UPDATE", payload.new)
          const parsedVote = VoteSchema.safeParse(payload.new)
          if (!parsedVote.success) {
            console.error("Invalid vote", parsedVote.error)
            return
          }

          const statement = statements.find(
            (s) => s.id === parsedVote.data.statement_id,
          )
          if (!statement) {
            console.error("Statement not found", parsedVote.data.statement_id)
            return
          }

          setStatements((prev) =>
            prev.map((s) =>
              s.id === statement.id
                ? {
                    ...s,
                    votes: s.votes.map((vote) =>
                      vote.player_id === parsedVote.data.player_id &&
                      vote.statement_id === parsedVote.data.statement_id
                        ? parsedVote.data
                        : vote,
                    ),
                  }
                : s,
            ),
          )
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "votes",
        },
        (payload) => {
          console.log("VOTE DELETE", payload.old)
          const parsedVote = VoteSchema.safeParse(payload.old)
          if (!parsedVote.success) {
            console.error("Invalid vote", parsedVote.error)
            return
          }
          const statement = statements.find(
            (s) => s.id === parsedVote.data.statement_id,
          )
          if (!statement) {
            console.error("Statement not found", parsedVote.data.statement_id)
            return
          }

          setStatements((prev) =>
            prev.map((s) =>
              s.id === statement.id
                ? {
                    ...s,
                    votes: s.votes.filter(
                      (vote) =>
                        vote.player_id !== parsedVote.data.player_id ||
                        vote.statement_id !== parsedVote.data.statement_id,
                    ),
                  }
                : s,
            ),
          )
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, gameId, statements, setStatements])

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Statement</th>
          <th>Created By</th>
          <th>Votes</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {statements.map((statement) => {
          const userVote = statement.votes.find(
            (vote) => vote.player_id === player_id,
          )
          return (
            <tr key={statement.id}>
              <td>{statement.text}</td>
              <td>
                {
                  players.find((p) => p.user_id === statement.created_by)
                    ?.username
                }
              </td>
              <td>
                {statement.votes.filter((vote) => vote.vote).length} /{" "}
                {statement.votes.length}
              </td>
              <td>
                <div className="grid grid-cols-2 gap-0">
                  <div>
                    <Button
                      variant="outline"
                      size="icon"
                      className={userVote?.vote === true ? "bg-slate-200" : ""}
                      onClick={async () => {
                        const res = await vote({
                          statement_id: statement.id,
                          vote: true,
                        })

                        if (res?.serverError) {
                          console.error(res.serverError)
                        }
                        toast.success("Upvoted")
                      }}>
                      <ArrowUpIcon stroke="green" strokeWidth="1px" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={userVote?.vote === false ? "bg-slate-200" : ""}
                      onClick={async () => {
                        const res = await vote({
                          statement_id: statement.id,
                          vote: false,
                        })

                        if (res?.serverError) {
                          console.error(res.serverError)
                        }
                        toast.success("Downvoted")
                      }}>
                      <ArrowDownIcon stroke="red" strokeWidth={"1px"} />
                    </Button>
                  </div>
                  <Button
                    className="row-span-2 h-full"
                    variant="outline"
                    onClick={async () => {
                      const res = await clearVote({
                        statement_id: statement.id,
                      })

                      if (res?.serverError) {
                        console.error(res.serverError)
                      }
                      toast.success("Vote cleared")
                    }}>
                    Clear
                  </Button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
