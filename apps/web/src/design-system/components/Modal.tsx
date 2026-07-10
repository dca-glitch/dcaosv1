import React, { ReactNode, useId, useRef } from 'react';
import { useOverlayA11y } from '../useOverlayA11y';
import Button from './Button';

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
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayA11y(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      style={{
        background: 'var(--ds-modal-backdrop)',
        backdropFilter: 'blur(2px)',
        zIndex: 'var(--ds-z-modal, var(--z-modal))',
      }}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[
          'relative w-full flex flex-col outline-none',
          'max-h-[88vh] overflow-hidden',
          sizeClass[size],
        ].join(' ')}
        style={{
          borderRadius: 'var(--ds-radius-xl)',
          border: '1px solid var(--ds-modal-border)',
          background: 'var(--ds-modal-gradient)',
          boxShadow: 'var(--ds-shadow-modal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-6 py-4 flex-shrink-0"
          style={{
            background: 'var(--ds-modal-chrome)',
            borderBottom: '1px solid var(--ds-divider)',
          }}
        >
          <div>
            <h2 id={titleId} className="text-[14px] font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="text-body-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="ml-4 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary transition-[opacity,color] duration-[120ms]"
            style={{
              background: 'var(--ds-surface-inset)',
              border: '1px solid var(--ds-divider)',
            }}
          >
            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div
            className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
            style={{
              background: 'var(--ds-modal-chrome)',
              borderTop: '1px solid var(--ds-divider)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

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
