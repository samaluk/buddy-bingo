/**
 * v0 by Vercel.
 * @see https://v0.dev/t/lJwnQlHSEBA
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CrumpledPaperIcon, HamburgerMenuIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { DesktopAvatar } from "./desktop-avatar"
import { MobileAvatar } from "./mobile-avatar"
import { ModeToggle } from "./mode-toggle"
import { createClient } from "@/utils/supabase/server"

export async function Navbar() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <HamburgerMenuIcon className="size-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" aria-describedby="undefined">
          <SheetTitle />
          <SheetDescription />
          <SheetClose asChild>
            <Link href="/" className="mr-6 hidden lg:flex" prefetch={false}>
              <CrumpledPaperIcon className="size-6" />
              <span className="sr-only">Buddy Bingo</span>
            </Link>
          </SheetClose>
          <div className="grid gap-2 py-6">
            <SheetClose asChild>
              <Link
                href="/games"
                className="flex w-full items-center py-2 text-lg font-semibold"
                prefetch={false}>
                Games
              </Link>
            </SheetClose>
            <MobileAvatar user={data.user} />
            <ModeToggle />
          </div>
        </SheetContent>
      </Sheet>
      <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}>
        <CrumpledPaperIcon className="size-6" />
        <span className="sr-only">Buddy Bingo</span>
      </Link>
      <nav className="ml-auto hidden gap-6 lg:flex">
        <Link
          href="/games"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}>
          Games
        </Link>
        <DesktopAvatar user={data.user} />
        <ModeToggle />
      </nav>
    </header>
  )
}
