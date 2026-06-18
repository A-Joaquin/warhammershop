import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-ember text-ink glow-accent hover:-translate-y-px",
        ghost:
          "border border-bone/40 text-bone hover:border-bone hover:bg-bone/5",
        steel:
          "border border-steel/60 text-bone hover:border-ember hover:text-ember",
        whatsapp:
          "bg-[#25D366] text-ink hover:shadow-[0_0_28px_rgba(37,211,102,0.45)] hover:-translate-y-px",
        gold:
          "bg-gold text-ink hover:shadow-[0_0_28px_rgba(201,162,75,0.45)] hover:-translate-y-px",
      },
      size: {
        sm: "px-4 py-2 text-[12px]",
        md: "px-6 py-3 text-[14px]",
        lg: "px-7 py-4 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
