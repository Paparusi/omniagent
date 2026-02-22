"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full rounded-lg border bg-dark-card px-3 text-sm text-text-primary",
              "placeholder:text-text-muted",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-dark-bg",
              icon && "pl-10",
              error
                ? "border-danger focus:ring-danger/50"
                : "border-dark-border focus:border-accent-blue focus:ring-accent-blue/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
