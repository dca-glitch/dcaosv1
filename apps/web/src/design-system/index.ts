/*
 * DCA OS Lite — Design System
 * Central export. Import from this file in all app code.
 *
 * Usage:
 *   import { Button, Badge, MetricCard, Table } from '@/design-system';
 */

/* ── Buttons ── */
export { default as Button }                from './components/Button';
export type { ButtonVariant, ButtonSize }   from './components/Button';

/* ── Status badges ── */
export { default as Badge, StatusBadge, ClientStatusBadge, StatusDot } from './components/Badge';
export type { BadgeVariant }                from './components/Badge';

/* ── Canonical STATUS map ── */
export {
  STATUS,
  STATUS_KEYS,
  CLIENT_STATUS_LABELS,
  normalizeStatusKey,
  getStatusVisual,
  getStatusTone,
  getClientStatusLabel,
  isClientVisibleStatus,
  formatStatusLabel,
  getPublishingStatusLabel,
  statusBadgeStyle,
  toneToStatusKey,
  statusTokenSuffix,
} from './status';
export type { StatusKey, StatusVisual, LegacyStatusTone } from './status';

/* ── Form fields ── */
export {
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
} from './components/FormFields';
export type { SelectOption }                from './components/FormFields';

/* ── Cards & layout primitives ── */
export {
  Card,
  CardHeader,
  CardFooter,
  MetricCard,
  PageHeader,
  SectionLabel,
  Divider,
  EmptyState,
} from './components/Card';

/* ── Panel helper ── */
export { panelCSS, raisedPanelCSS } from './panel';

/* ── Tables ── */
export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  TdDouble,
  TablePagination,
  TimelineItem,
  ActivityItem,
} from './components/Table';
export type { TableDensity } from './components/Table';

/* ── Modals ── */
export { default as Modal, ConfirmDialog }  from './components/Modal';
export type { ModalSize }                   from './components/Modal';

/* ── Alerts & feedback ── */
export { default as Alert, Toast, SuccessState }  from './components/Alert';
export type { AlertVariant }                from './components/Alert';

/* ── App layout ── */
export {
  AppShell,
  Sidebar,
  SidebarLogo,
  SidebarUser,
  NavSection,
  NavItem,
  Topbar,
} from './components/Layout';

/* ── Loading states ── */
export {
  Spinner,
  Skeleton,
  SkeletonRow,
  SkeletonCard,
} from './components/Spinner';

/* ── Tabs & filter pills ── */
export { Tabs, FilterPills } from './components/Tabs';
export type {
  TabOption,
  TabsProps,
  FilterPillOption,
  FilterPillsProps,
} from './components/Tabs';
