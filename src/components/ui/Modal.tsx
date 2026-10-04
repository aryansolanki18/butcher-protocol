import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide = false }: ModalProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`relative my-4 w-full rounded-[5px] border border-border-strong bg-elevated u-shadow-panel ${
              wide ? 'max-w-4xl' : 'max-w-2xl'
            }`}
          >
            <div className="flex items-start justify-between gap-6 border-b border-border-subtle px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-primary">
                  {title}
                </h2>
                {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] border border-border-subtle text-muted transition-colors hover:border-border-strong hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-5 sm:px-6">{children}</div>
            {footer ? (
              <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}