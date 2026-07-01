import React, { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  variant?:   BadgeVariant;
  dot?:       boolean;
  icon?:      ReactNode;
  children:   ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  primary: 'ds-badge-primary',
  success: 'ds-badge-success',
  warning: 'ds-badge-warning',
  danger:  'ds-badge-danger',
  muted:   'ds-badge-muted',
};

const Badge: React.FC<BadgeProps> = ({
  variant   = 'muted',
  dot       = true,
  icon,
  children,
  className = '',
}) => (
  <span className={`ds-badge ${variantClass[variant]} ${className}`}>
    {icon && !dot && (
      <span className="flex-shrink-0 flex items-center" aria-hidden="true">{icon}</span>
    )}
    {dot && !icon && <span className="ds-badge-dot" aria-hidden="true" />}
    {children}
  </span>
);

export default Badge;

/* ── Convenience wrappers matching DCA workflow statuses ── */
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    // Admin copy
    APPROVED:                { variant: 'success', label: 'Approved'       },
    PENDING_CLIENT_REVIEW:   { variant: 'warning', label: 'Needs review'   },
    CHANGES_REQUESTED:       { variant: 'danger',  label: 'Changes req.'   },
    IN_PROGRESS:             { variant: 'primary', label: 'In progress'    },
    DRAFT:                   { variant: 'muted',   label: 'Draft'          },
    PUBLISHED:               { variant: 'success', label: 'Published'      },
    ARCHIVED:                { variant: 'muted',   label: 'Archived'       },
    // Finance
    PAID:                    { variant: 'success', label: 'Paid'           },
    ISSUED:                  { variant: 'primary', label: 'Issued'         },
    OVERDUE:                 { variant: 'danger',  label: 'Overdue'        },
  };

  const entry = map[status] ?? { variant: 'muted' as BadgeVariant, label: status };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
};

/* Client-facing label version (human copy) */
export const ClientStatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    PENDING_CLIENT_REVIEW: { variant: 'warning', label: 'Needs your review'   },
    APPROVED:              { variant: 'success', label: 'Approved'             },
    CHANGES_REQUESTED:     { variant: 'danger',  label: 'Changes requested'    },
    PUBLISHED:             { variant: 'success', label: 'Published'            },
    IN_PROGRESS:           { variant: 'primary', label: 'Being prepared'       },
    DRAFT:                 { variant: 'muted',   label: 'Draft'                },
  };

  const entry = map[status] ?? { variant: 'muted' as BadgeVariant, label: status };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
};
