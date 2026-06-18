import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-ink-2 border border-char px-4 py-3 text-bone placeholder:text-bone/35 font-sans text-sm",
      "focus:outline-none focus:border-ember/70 transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-ink-2 border border-char px-4 py-3 text-bone placeholder:text-bone/35 font-sans text-sm resize-none",
      "focus:outline-none focus:border-ember/70 transition-colors",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
