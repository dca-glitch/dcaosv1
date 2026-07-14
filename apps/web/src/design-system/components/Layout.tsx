import React, { ReactNode } from 'react';

/**
 * Dormant design-system shell primitives.
 * The running application shell lives under apps/web/src/components/shell/.
 */

/* ─────────────────────── APP SHELL ─────────────────────── */
interface AppShellProps {
  sidebar:  ReactNode;
  topbar?:  ReactNode;
  children: ReactNode;
  density?: 'compact' | 'comfortable';
}

export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  topbar,
  children,
  density = 'compact',
}) => (
  <div
    className="flex min-h-screen"
    style={{ background: 'var(--bg-page-gradient)' }}
    data-density={density}
  >
    {sidebar}
    <div className="flex flex-col flex-1 min-w-0">
      {topbar}
      <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
    </div>
  </div>
);

/* ─────────────────────── SIDEBAR ─────────────────────── */
interface SidebarProps {
  logo:      ReactNode;
  footer?:   ReactNode;
  children:  ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ logo, footer, children }) => (
  <aside
    className="w-sidebar flex-shrink-0 flex flex-col border-r border-border-subtle"
    style={{ background: 'var(--surface-sidebar)' }}
  >
    {/* Logo area */}
    <div className="border-b border-border-subtle">{logo}</div>

    {/* Nav sections */}
    <nav className="flex-1 overflow-y-auto py-2">{children}</nav>

    {/* Footer */}
    {footer && (
      <div className="border-t border-border-subtle">{footer}</div>
    )}
  </aside>
);

/* ─────────────────────── SIDEBAR LOGO ─────────────────────── */
interface SidebarLogoProps {
  name:    string;
  tenant?: string;
  icon?:   ReactNode;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({ name, tenant, icon }) => (
  <div className="flex items-center gap-2.5 px-4 py-3.5">
    {icon && (
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-primary-text">
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-body-sm font-semibold text-text-primary truncate">{name}</p>
      {tenant && (
        <p className="text-caption text-text-muted truncate">{tenant}</p>
      )}
    </div>
  </div>
);

/* ─────────────────────── NAV SECTION ─────────────────────── */
interface NavSectionProps {
  label?:   string;
  children: ReactNode;
}

export const NavSection: React.FC<NavSectionProps> = ({ label, children }) => (
  <div className="pt-1.5 pb-1">
    {label && (
      <p className="px-4 py-1 text-caption font-semibold uppercase tracking-wider text-border-strong">
        {label}
      </p>
    )}
    {children}
  </div>
);

/* ─────────────────────── NAV ITEM ─────────────────────── */
interface NavItemProps {
  icon?:      ReactNode;
  children:   ReactNode;
  active?:    boolean;
  onClick?:   () => void;
  badge?:     string | number;
  disabled?:  boolean;
  className?: string;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  children,
  active   = false,
  onClick,
  badge,
  disabled = false,
  className = '',
}) => (
  <button
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
    className={[
      'w-full flex items-center gap-2 px-3 py-1.5 text-body-xs',
      'border-l-2 transition-all duration-[120ms]',
      'rounded-r-md rounded-l-none',
      'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-text',
      active
        ? 'border-l-primary-text text-primary-text font-semibold'
        : 'border-l-transparent text-text-muted hover:text-text-secondary font-medium',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      className,
    ].join(' ')}
    style={
      active
        ? { background: 'var(--primary-nav-active)' }
        : undefined
    }
    aria-current={active ? 'page' : undefined}
  >
    {icon && (
      <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
    )}
    <span className="flex-1 text-left truncate">{children}</span>
    {badge !== undefined && (
      <span
        className={[
          'ml-auto px-1.5 py-0.5 rounded-full text-caption font-semibold leading-none',
          active
            ? 'bg-primary-soft text-primary-text'
            : 'bg-elevated text-text-muted',
        ].join(' ')}
      >
        {badge}
      </span>
    )}
  </button>
);

/* ─────────────────────── TOPBAR ─────────────────────── */
interface TopbarProps {
  title:      string;
  subtitle?:  string;
  actions?:   ReactNode;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <header
    className={`flex items-center justify-between px-6 h-topbar border-b border-border-subtle flex-shrink-0 ${className}`}
    style={{ background: 'var(--surface-topbar)' }}
  >
    <div>
      <h1 className="text-title-sm font-semibold text-text-primary leading-tight">{title}</h1>
      {subtitle && (
        <p className="text-caption font-mono text-text-muted mt-0.5">{subtitle}</p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>
    )}
  </header>
);

/* ─────────────────────── SIDEBAR FOOTER (user) ─────────────────────── */
interface SidebarUserProps {
  name:    string;
  email:   string;
  role?:   string;
  avatar?: ReactNode;
}

export const SidebarUser: React.FC<SidebarUserProps> = ({
  name,
  email,
  role,
  avatar,
}) => (
  <div className="flex items-center gap-2.5 px-4 py-3">
    {avatar ?? (
      <div className="w-7 h-7 rounded-full bg-primary-soft border border-border-accent flex items-center justify-center flex-shrink-0">
        <span className="text-caption font-semibold text-primary-text">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-body-xs font-semibold text-text-secondary truncate">{name}</p>
      <p className="text-caption text-text-muted truncate">{role ?? email}</p>
    </div>
  </div>
);
