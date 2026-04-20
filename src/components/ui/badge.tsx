import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full text-xs font-medium uppercase tracking-wide h-6 px-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-white",
        secondary: "bg-[var(--bg-card)] text-[var(--gray-800)] border border-[var(--border-light)]",
        outline: "text-[var(--primary)] border border-[var(--primary)] bg-background hover:bg-[var(--primary)]/5",
        destructive: "bg-[var(--error)] text-white border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

