"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea based on its scroll height
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      adjustHeight();
    },
    [adjustHeight]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const isEmpty = value.trim().length === 0;

  return (
    <div
      className={cn(
        "flex items-end gap-3 border-t border-dark-border bg-dark-bg px-4 py-3"
      )}
    >
      <div
        className={cn(
          "flex flex-1 items-end rounded-xl border border-dark-border bg-dark-card",
          "transition-colors duration-150",
          "focus-within:border-accent-blue/50 focus-within:ring-1 focus-within:ring-accent-blue/25",
          disabled && "opacity-50"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Not connected..." : "Type a message..."}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent px-4 py-3 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none",
            "disabled:cursor-not-allowed"
          )}
        />
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || isEmpty}
        aria-label="Send message"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg",
          disabled || isEmpty
            ? "cursor-not-allowed bg-dark-card text-text-muted"
            : "bg-accent-blue text-white shadow-lg shadow-accent-blue/20 hover:bg-accent-blue/90 active:scale-95"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
