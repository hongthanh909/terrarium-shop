import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold tracking-normal transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary-hover hover:bg-primary-hover",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline:
          "border border-border bg-background text-foreground hover:border-border-strong hover:bg-muted",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground hover:bg-border/70",
        ghost:
          "border border-transparent hover:bg-muted hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        soft:
          "border border-primary-border bg-primary-soft text-primary hover:bg-primary-soft/70",
        brand:
          "border border-border-strong bg-white text-foreground shadow-sm hover:border-muted-foreground/50 hover:bg-muted",
      },
      size: {
        default: "h-12 px-4 text-sm",
        sm:      "h-11 px-3 text-sm",
        lg:      "h-12 px-6 text-sm",
        xs:      "min-h-11 px-3 text-xs",
        icon:    "h-11 w-11 px-0",
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
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const showLoading = loading && !asChild
    return (
      <Comp
        data-ui="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-busy={showLoading || undefined}
        disabled={!asChild ? disabled || showLoading : undefined}
        {...props}
      >
        {showLoading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText ?? children}</span>
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
