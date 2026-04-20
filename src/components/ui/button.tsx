import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 h-11 px-8 min-w-[120px] shadow-md hover:shadow-lg",
        secondary: "bg-[var(--bg-card)] text-[var(--gray-800)] border border-[var(--border-light)] hover:bg-[var(--bg-card-hover)] h-11 px-8 min-w-[120px] shadow-sm",
        destructive: "bg-[var(--error)] text-white hover:bg-[var(--error)]/90 h-11 px-8 min-w-[120px] shadow-md",
        outline: "border border-[var(--border-medium)] bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 min-w-[120px]",
      },
      size: {
        default: "h-11 px-8",
        sm: "h-9 rounded-md px-6",
        lg: "h-12 rounded-[12px] px-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
Button.displayName = "Button"

export { Button, buttonVariants }

