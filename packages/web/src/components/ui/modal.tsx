"use client";

import {
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

function ModalHeader({ children, className, onClose }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-dark-border px-6 py-4",
        className
      )}
    >
      <h2 className="text-lg font-semibold text-text-primary">{children}</h2>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-dark-hover hover:text-text-primary"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-dark-border px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

function Modal({ open, onClose, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  const portal = createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "animate-scale-in w-full max-w-lg rounded-xl border border-dark-border bg-dark-card shadow-2xl",
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );

  return portal;
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal };
