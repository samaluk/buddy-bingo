"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

export async function login(formData: FormData) {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

  const { error: validationError, data: validatedData } =
    loginSchema.safeParse(data)

  if (validationError) {
    redirect("/error")
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword(validatedData)

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(formData: FormData) {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  }

  const loginSchema = z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      passwordConfirmation: z.string().min(8),
    })
    .superRefine(({ password, passwordConfirmation }, ctx) => {
      if (password !== passwordConfirmation) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["passwordConfirmation"],
        })
      }
    })

  const { error: validationError, data: validData } =
    loginSchema.safeParse(data)
  if (validationError) {
    redirect("/error")
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: validData.email,
    password: validData.password,
  })

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}
