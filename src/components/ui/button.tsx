import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(201,138,46,0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(255,50,50,0.3)]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:shadow-[0_0_10px_rgba(201,138,46,0.2)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gold: "vish-btn-gold px-6 py-3 hover:shadow-[0_0_20px_rgba(201,138,46,0.4)]",
        goldOutline: "vish-btn-gold-outline px-5 py-3 hover:shadow-[0_0_15px_rgba(201,138,46,0.2)]",
        workstation: "vish-btn-workstation px-4 py-2 touch-target hover:shadow-[0_0_10px_rgba(201,138,46,0.15)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        gold: "min-h-[44px] px-6 py-3 text-[0.7rem]",
        full: "w-full",
      },
    },
    compoundVariants: [
      { variant: "gold", size: "default", class: "h-auto min-h-[44px]" },
      { variant: "goldOutline", size: "default", class: "h-auto min-h-[44px]" },
      { variant: "gold", size: "full", class: "w-full" },
      { variant: "goldOutline", size: "full", class: "w-full" },
    ],
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
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch (err) {
          // Ignore
        }
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick as any}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
