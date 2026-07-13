# DCA OS Lite — Design System

**Dark theme · Option 1 Muted Professional · WCAG AA**

---

## Instalacja w C:\dcaosv1

### 1. Skopiuj folder

```
src/design-system/
├── tokens.css                   ← CSS vars + gradienty + base styles
├── components/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── FormFields.tsx           ← Input, Textarea, Select, Checkbox, RadioGroup
│   ├── Card.tsx                 ← Card, MetricCard, PageHeader, SectionLabel, EmptyState
│   ├── Table.tsx                ← Table, TableHead, Th, Td, TdDouble, TablePagination
│   ├── Modal.tsx                ← Modal, ConfirmDialog
│   ├── Alert.tsx                ← Alert, Toast
│   ├── Layout.tsx               ← AppShell, Sidebar, NavItem, Topbar
│   └── Spinner.tsx              ← Spinner, Skeleton, SkeletonRow, SkeletonCard
├── showcase/
│   └── DesignShowcase.tsx       ← Galeria komponentów
└── index.ts                     ← Centralny export
```

### 2. Tailwind config

`apps/web/tailwind.config.ts` is the live Tailwind config used by the web app.
The design-system package no longer owns a separate Tailwind config file.

### 3. Import CSS tokens w src/index.css

```css
/* src/index.css */
@import './design-system/tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Dodaj showcase do routera (src/App.tsx lub router)

```tsx
import DesignShowcase from '@/design-system/showcase/DesignShowcase';

// W HashRouter:
<Route path="/admin/design-system" element={<DesignShowcase />} />
```

Dostęp: `http://localhost:5173/#/admin/design-system`

---

## Quick reference

### Import

```tsx
import {
  Button, Badge, StatusBadge,
  Input, Select, Textarea, Checkbox,
  Card, CardHeader, MetricCard, PageHeader, SectionLabel,
  Table, TableHead, TableBody, TableRow, Th, Td, TdDouble,
  Modal, ConfirmDialog,
  Alert, Toast,
  Spinner, Skeleton,
  AppShell, Sidebar, NavItem, Topbar,
} from '@/design-system';
```

### Button

```tsx
<Button variant="primary">New project</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">More</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Approve all</Button>
<Button loading>Saving...</Button>
<Button size="sm" icon={<i className="ti ti-plus" />}>Add</Button>
```

### Badge — status

Zawsze używaj `StatusBadge` zamiast ręcznych Badge dla statusów workflow:

```tsx
// Admin copy (operacyjne)
<StatusBadge status="APPROVED" />              // → Approved (green)
<StatusBadge status="PENDING_CLIENT_REVIEW" /> // → Needs review (amber)
<StatusBadge status="CHANGES_REQUESTED" />     // → Changes req. (red)
<StatusBadge status="IN_PROGRESS" />           // → In progress (blue)
<StatusBadge status="DRAFT" />                 // → Draft (muted)
<StatusBadge status="PAID" />                  // → Paid (green)
<StatusBadge status="OVERDUE" />               // → Overdue (red)

// Client copy (ludzkie)
<ClientStatusBadge status="PENDING_CLIENT_REVIEW" /> // → Needs your review
<ClientStatusBadge status="APPROVED" />              // → Approved
<ClientStatusBadge status="CHANGES_REQUESTED" />     // → Changes requested
```

### MetricCard (KPI)

```tsx
<div className="grid grid-cols-4 gap-3">
  <MetricCard label="Active clients" value={8} />
  <MetricCard label="Needs review"   value={4} valueColor="warning" />
  <MetricCard label="Approved"       value={7} valueColor="success" />
  <MetricCard label="Revenue MTD"    value="$24.5k" mono />
</div>
```

### Table (admin compact)

```tsx
<Table>
  <TableHead>
    <TableRow>
      <Th>Project</Th>
      <Th>Client</Th>
      <Th>Status</Th>
      <Th align="right">Updated</Th>
    </TableRow>
  </TableHead>
  <TableBody>
    {projects.map(p => (
      <TableRow key={p.id} clickable onClick={() => navigate(`/projects/${p.id}`)}>
        <TdDouble primary={p.name} secondary={p.month} />
        <Td secondary>{p.client.name}</Td>
        <Td><StatusBadge status={p.status} /></Td>
        <Td align="right" mono>{timeAgo(p.updatedAt)}</Td>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Modal + form

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>New project</Button>

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="New project"
  subtitle="Fill in the details below"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit}>Create project</Button>
    </>
  }
>
  <div className="flex flex-col gap-4">
    <Input label="Project name" placeholder="SEO May 2026" required />
    <Select label="Client" options={clientOptions} />
    <Textarea label="Notes" placeholder="Add context..." />
  </div>
</Modal>
```

### AppShell

```tsx
<AppShell
  density="compact"
  sidebar={
    <Sidebar
      logo={<SidebarLogo name="DCA OS" tenant="DCA Agency" />}
      footer={<SidebarUser name="Piotr P." email="admin@dca.local" role="Owner" />}
    >
      <NavSection label="Core">
        <NavItem icon={<i className="ti ti-home" />}       active={page === 'dashboard'} onClick={() => navigate('/')}>Dashboard</NavItem>
        <NavItem icon={<i className="ti ti-users" />}       onClick={() => navigate('/clients')}>Clients</NavItem>
        <NavItem icon={<i className="ti ti-robot" />}       onClick={() => navigate('/ai-delivery')}>AI Delivery</NavItem>
        <NavItem icon={<i className="ti ti-chart-bar" />}   onClick={() => navigate('/market-intel')}>Market intel</NavItem>
      </NavSection>
      <NavSection label="Finance">
        <NavItem icon={<i className="ti ti-file-invoice" />} onClick={() => navigate('/invoices')}>Invoices</NavItem>
      </NavSection>
    </Sidebar>
  }
  topbar={
    <Topbar
      title="AI Delivery"
      subtitle="Jun 2026 · 12 active projects"
      actions={<Button variant="primary" size="sm">New project</Button>}
    />
  }
>
  {/* page content */}
</AppShell>
```

---

## Density modes

Dwa tryby gęstości informacji — ten sam design system, różne zmienne CSS:

```tsx
// Admin (power user, 6-8h/day)
<div data-density="compact">
  {/* 13px text, 44px rows, 12px cell padding */}
</div>

// Client Portal
<div data-density="comfortable">
  {/* 14px text, 52px rows, 16px cell padding */}
</div>
```

Najłatwiej ustawić na poziomie AppShell (`density` prop).

---

## Paleta kolorów

### Tła (gradient layers)

| Token CSS var              | Gdzie używany            |
|---------------------------|--------------------------|
| `--bg-page-gradient`       | `<html>` / `AppShell`    |
| `--surface-sidebar`        | `Sidebar`                |
| `--surface-topbar`         | `Topbar`                 |
| `--surface-card`           | `Card`                   |
| `--surface-elevated`       | `MetricCard`, `Modal`    |
| `--surface-overlay`        | Table header, overlay    |

### Tekst

| Klasa Tailwind         | Wartość              | Użycie                    |
|-----------------------|----------------------|---------------------------|
| `text-text-primary`   | `#F1F5F9`            | Body text, headings        |
| `text-text-secondary` | `rgba(148,163,184,.88)` | Supporting text          |
| `text-text-muted`     | `rgba(100,116,139,.80)` | Labels, hints, placeholders |
| `text-text-disabled`  | `rgba(71,85,105,.60)` | Disabled state             |

### Statusy (WCAG AA — tekst na ciemnym tle)

| Rola     | Hex tekstu   | Tailwind class        |
|----------|--------------|----------------------|
| Primary  | `#7C8FCA`    | `text-primary-text`  |
| Success  | `#6FA989`    | `text-success-text`  |
| Warning  | `#BE8F68`    | `text-warning-text`  |
| Danger   | `#B96F6F`    | `text-danger-text`   |

---

## Migration checklist (istniejący kod)

```
□ Zastąp <button className="..."> → <Button variant="...">
□ Zastąp <input className="...">  → <Input label="...">
□ Zastąp <table>...</table>       → <Table><TableHead>...
□ Zastąp ręczne badge div'y       → <StatusBadge status="...">
□ Zastąp div.card                 → <Card variant="...">
□ Zastąp ChangePasswordModal      → przepisz wewnątrz <Modal>
□ Zastąp CreateUserModal          → przepisz wewnątrz <Modal>
□ Usuń stare klasy .btn, .badge, .card z CSS
□ Usuń stare kolory (#6366F1 itp.) z kodu
□ Sprawdź czy każda strona używa AppShell
□ Ustaw data-density na divie wrappera (compact/comfortable)
□ Przetestuj http://localhost:5173/#/admin/design-system
```

---

## FAQ

**Q: Tailwind nie widzi customowych klas?**
A: Sprawdź czy `apps/web/tailwind.config.ts` jest w rocie projektu i czy `src/design-system/tokens.css` jest importowany w `src/index.css`.

**Q: Gradienty nie renderują się?**
A: Sprawdź czy browser nie blokuje `var()` — to standard CSS, działa wszędzie od 2017.

**Q: Fonty nie ładują się (JetBrains Mono)?**
A: `tokens.css` importuje z Google Fonts. Jeśli brak internetu — system fallback to `ui-monospace`.

**Q: Jak dodać nowy status do badge?**
A: Otwórz `Badge.tsx`, dodaj wpis do obiektu `map` w `StatusBadge`.

**Q: Jak zmienić szerokość sidebara?**
A: Zmień `--sidebar-width` w `tokens.css` i `w-sidebar` w `apps/web/tailwind.config.ts`.

---

*Design system DCA OS Lite · Dark theme · Muted Professional palette*
