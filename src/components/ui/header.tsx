
"use client"

import { cn } from "@/lib/utils"

export const Header = ({
  className,
  sticky,
  ...props
}: React.HTMLAttributes<HTMLElement> & { sticky?: boolean }) => (
  <header
    className={cn(
      "flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6",
      sticky && "sticky top-0 z-40",
      className
    )}
    {...props}
  />
)

export const HeaderTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      "text-lg font-semibold tracking-tight text-foreground",
      className
    )}
    {...props}
  />
)
