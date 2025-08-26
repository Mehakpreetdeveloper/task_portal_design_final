import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface CalculatorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "accent" | "secondary";
}

export const CalculatorButton = forwardRef<HTMLButtonElement, CalculatorButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "relative h-16 rounded-2xl font-medium text-xl transition-all duration-200 ease-out",
          "backdrop-blur-sm border border-white/10",
          "active:scale-95 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          
          // Variant styles
          {
            // Default - number buttons
            "bg-calculator-number/40 text-calculator-number-text hover:bg-calculator-number/60": 
              variant === "default",
            
            // Primary - equals button
            "bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-primary/25": 
              variant === "primary",
            
            // Accent - operation buttons
            "bg-gradient-accent text-accent-foreground shadow-lg hover:shadow-accent/25": 
              variant === "accent",
            
            // Secondary - clear/utility buttons
            "bg-secondary/40 text-secondary-foreground hover:bg-secondary/60": 
              variant === "secondary",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

CalculatorButton.displayName = "CalculatorButton";