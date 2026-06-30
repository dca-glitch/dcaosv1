import React, { ReactNode, useEffect, useCallback } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  title:        string;
  subtitle?:    string;
  children:     ReactNode;
  footer?:      ReactNode;
  size?:        ModalSize;
  closeOnBackdrop?: boolean;
}

const sizeClass: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-5xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size             = 'md',
  closeOnBackdrop  = true,
}) => {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  return (
    /* Backdrop — normal flow div, not fixed */
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      style={{
        alignItems: 'center',
        background: 'rgba(2,3,6,0.80)',
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        left: 0,
        padding: '16px',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 'var(--z-modal)',
      }}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Panel */}
      <div
        className={[
          'relative w-full flex flex-col',
          'border border-border-strong rounded-lg',
          'max-h-[90vh]',
          sizeClass[size],
        ].join(' ')}
        style={{
          background:   'var(--surface-elevated)',
          boxShadow:    'var(--shadow-modal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
          <div>
            <h2 id="modal-title" className="text-title-sm font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="text-body-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="ml-4 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-card border border-transparent hover:border-border transition-all"
          >
            <svg width={16} height={16} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-2 px-5 py-3 flex-shrink-0 border-t border-border-subtle"
            style={{ background: 'var(--surface-overlay)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

/* ─── Confirm Dialog (opinionated Modal wrapper) ─── */
import Button from './Button';

interface ConfirmDialogProps {
  isOpen:      boolean;
  onClose:     () => void;
  onConfirm:   () => void;
  title:       string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:     boolean;
  loading?:    boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger       = false,
  loading      = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {description && (
      <p className="text-body-sm text-text-secondary">{description}</p>
    )}
  </Modal>
);
