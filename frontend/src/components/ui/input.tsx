import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-[#2D2DDD] focus-visible:ring-2 focus-visible:ring-[#2D2DDD]/40 disabled:cursor-not-allowed disabled:opacity-50 font-figtree transition-all hover:border-[#2D2DDD]/50 dark:border-border-dark dark:bg-muted-dark dark:text-foreground-dark dark:placeholder:text-muted-foreground dark:hover:border-[#2D2DDD]/60 dark:focus-visible:border-[#2D2DDD] border-focus-thin",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
