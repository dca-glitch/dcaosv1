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
export { default as Badge, StatusBadge, ClientStatusBadge } from './components/Badge';
export type { BadgeVariant }                from './components/Badge';

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
} from './components/Table';

/* ── Modals ── */
export { default as Modal, ConfirmDialog }  from './components/Modal';
export type { ModalSize }                   from './components/Modal';

/* ── Alerts & feedback ── */
export { default as Alert, Toast }          from './components/Alert';
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
