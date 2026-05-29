import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: pill shape (radius.xl=50px từ DESIGN.md), transition 200ms (motion.duration.fast)
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:-translate-y-0.5",
        outline:
          "border-2 border-primary/30 bg-background text-foreground hover:bg-primary/8 hover:text-primary hover:border-primary/60 hover:shadow-[0_2px_12px_rgba(66,87,51,0.2)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft hover:-translate-y-0.5",
        ghost:
          "hover:bg-primary/10 hover:text-primary",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // radius.xl = 50px → rounded-full (pill), radius.md = 20px → rounded-2xl
        default: "h-10 px-6 rounded-full text-sm tracking-wide",
        sm:      "h-8  px-4 rounded-full text-xs tracking-wide",
        lg:      "h-12 px-8 rounded-full text-base tracking-wide",
        icon:    "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
