import React, { useState } from 'react';
import {
  Button,
  Badge, StatusBadge,
  Input, Textarea, Select, Checkbox, RadioGroup,
  Card, CardHeader, CardFooter,
  MetricCard, PageHeader, SectionLabel, EmptyState,
  Table, TableHead, TableBody, TableRow, Th, Td, TdDouble,
  Modal, ConfirmDialog,
  Alert, Toast,
  Spinner, Skeleton, SkeletonCard,
  Tabs, FilterPills,
} from '../index';

/* ─── helpers ─── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <SectionLabel className="mb-4">{title}</SectionLabel>
    {children}
  </section>
);

const Row: React.FC<{ children: React.ReactNode; wrap?: boolean; className?: string }> = ({ children, wrap = true, className }) => (
  <div className={`flex items-start gap-3 ${wrap ? 'flex-wrap' : ''} ${className ?? ''}`}>{children}</div>
);

/* ─── SHOWCASE PAGE ─── */
const DesignShowcase: React.FC = () => {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [radioVal,     setRadioVal]     = useState('draft');
  const [checked,      setChecked]      = useState(false);
  const [activeTab,    setActiveTab]    = useState('archive');
  const [statusFilter, setStatusFilter] = useState('active');
  const [clientFilter, setClientFilter] = useState('all_kinds');

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto" data-density="compact">

      <PageHeader
        title="Design system"
        subtitle="Component reference for DCA OS Lite — dark theme"
        breadcrumb="Admin / Settings"
      />

      {/* ── BUTTONS ── */}
      <Section title="Buttons">
        <Row>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="success">Approve</Button>
        </Row>
        <Row className="mt-3">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </Row>
        <Row className="mt-3">
          <Button variant="primary" loading>Saving...</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button variant="primary" fullWidth className="max-w-xs">Full width</Button>
        </Row>
      </Section>

      {/* ── TABS & FILTER PILLS ── */}
      <Section title="Tabs & filter pills">
        <p className="text-body-xs text-text-muted mb-3">Section navigation (Tabs)</p>
        <Tabs
          options={[
            { value: 'archive',            label: 'Archive'            },
            { value: 'pending_approvals',  label: 'Pending Approvals'  },
            { value: 'briefs',             label: 'Briefs'             },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        <p className="text-body-xs text-text-muted mt-6 mb-3">Status filter (FilterPills, single-select)</p>
        <FilterPills
          ariaLabel="Status filter"
          options={[
            { value: 'active',   label: 'Active',   count: 4 },
            { value: 'archived', label: 'Archived', count: 2 },
            { value: 'all',      label: 'All',      count: 6 },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <p className="text-body-xs text-text-muted mt-6 mb-3">Client kind filter (FilterPills, six options)</p>
        <FilterPills
          ariaLabel="Client kind filter"
          options={[
            { value: 'all_kinds',  label: 'All kinds'   },
            { value: 'agency',     label: 'Agency'      },
            { value: 'own_domain', label: 'Own domain'  },
            { value: 'active',     label: 'Active'      },
            { value: 'archived',   label: 'Archived'    },
            { value: 'all',        label: 'All'         },
          ]}
          value={clientFilter}
          onChange={setClientFilter}
        />
      </Section>

      {/* ── BADGES ── */}
      <Section title="Status badges">
        <Row>
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Needs review</Badge>
          <Badge variant="danger">Changes req.</Badge>
          <Badge variant="primary">In progress</Badge>
          <Badge variant="muted">Draft</Badge>
        </Row>
        <Row className="mt-3">
          <StatusBadge status="APPROVED" />
          <StatusBadge status="PENDING_CLIENT_REVIEW" />
          <StatusBadge status="CHANGES_REQUESTED" />
          <StatusBadge status="IN_PROGRESS" />
          <StatusBadge status="PUBLISHED" />
          <StatusBadge status="DRAFT" />
        </Row>
        <Row className="mt-3">
          <StatusBadge status="PAID" />
          <StatusBadge status="ISSUED" />
          <StatusBadge status="OVERDUE" />
        </Row>
      </Section>

      {/* ── FORM FIELDS ── */}
      <Section title="Form fields">
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Input
            label="Project name"
            placeholder="SEO May 2026"
          />
          <Input
            label="Client email"
            type="email"
            placeholder="anna@puriva.id"
            helperText="Used for automated notifications"
          />
          <Input
            label="Field with error"
            placeholder="Enter value..."
            error="This field is required"
          />
          <Select
            label="Client"
            placeholder="Select client..."
            options={[
              { value: 'puriva',  label: 'Puriva Clinic'  },
              { value: 'acme',    label: 'Acme Corp'      },
              { value: 'coco',    label: 'Coco Grande'    },
            ]}
          />
        </div>
        <div className="mt-4 max-w-2xl">
          <Textarea
            label="Brief notes"
            placeholder="Focus on product pages, category guides..."
            minRows={3}
          />
        </div>
        <Row className="mt-4">
          <Checkbox
            label="Notify client on changes"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </Row>
        <div className="mt-4">
          <RadioGroup
            name="status"
            label="Initial status"
            value={radioVal}
            onChange={setRadioVal}
            options={[
              { value: 'draft',       label: 'Draft'       },
              { value: 'in_progress', label: 'In progress' },
              { value: 'review',      label: 'Needs review'},
            ]}
          />
        </div>
      </Section>

      {/* ── METRIC CARDS ── */}
      <Section title="Metric cards (KPI)">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Active clients"  value={8}       />
          <MetricCard label="Needs review"    value={4}       valueColor="warning" />
          <MetricCard label="Approved"        value={7}       valueColor="success" />
          <MetricCard label="Revenue MTD"     value="$24.5k"  mono />
        </div>
      </Section>

      {/* ── CARDS ── */}
      <Section title="Cards">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader
              title="Default card"
              subtitle="Standard surface"
              action={<Button size="sm" variant="secondary">Edit</Button>}
            />
            <p className="text-body-sm text-text-secondary">
              Used for general content grouping. Subtle gradient surface.
            </p>
            <CardFooter>
              <Button size="sm" variant="ghost">Cancel</Button>
              <Button size="sm" variant="primary">Save</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated" hoverable>
            <CardHeader title="Elevated card" subtitle="KPI / important content" />
            <p className="text-body-sm text-text-secondary">
              Higher elevation, stronger border. Used for metric cards, featured sections.
            </p>
          </Card>

          <Card
            variant="client"
            urgentBorderColor="var(--text-warning)"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-body-md font-semibold text-text-primary">SEO May 2026</p>
                <p className="text-body-sm text-text-secondary mt-0.5">
                  3 articles and 4 images ready for review
                </p>
              </div>
              <Badge variant="warning">Needs review</Badge>
            </div>
            <Row>
              <Button variant="success" size="sm">Approve all</Button>
              <Button variant="secondary" size="sm">Review individually</Button>
            </Row>
          </Card>

          <EmptyState
            title="No projects yet"
            description="Create your first project to start the AI delivery workflow."
            action={<Button variant="primary">Create project</Button>}
          />
        </div>
      </Section>

      {/* ── TABLE ── */}
      <Section title="Table">
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
            {[
              { project: 'SEO May 2026',     client: 'Puriva Clinic',  status: 'PENDING_CLIENT_REVIEW', updated: '2h ago'  },
              { project: 'Content plan Q2',   client: 'Acme Corp',     status: 'APPROVED',               updated: '1d ago'  },
              { project: 'Brand brief 02',    client: 'Smoke Test',    status: 'IN_PROGRESS',            updated: '3h ago'  },
              { project: 'Social media Q1',   client: 'Coco Grande',   status: 'CHANGES_REQUESTED',      updated: '5d ago'  },
              { project: 'SEO Jan 2026',      client: 'Acme Corp',     status: 'DRAFT',                  updated: '1w ago'  },
            ].map((row, i) => (
              <TableRow key={i} clickable>
                <TdDouble primary={row.project} secondary="Jun 2026" />
                <Td secondary>{row.client}</Td>
                <Td><StatusBadge status={row.status} /></Td>
                <Td align="right" mono>{row.updated}</Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* ── ALERTS ── */}
      <Section title="Alerts">
        <div className="flex flex-col gap-3 max-w-xl">
          <Alert variant="success" title="Changes saved" message="The project has been updated." onClose={() => {}} />
          <Alert variant="warning" title="Review pending" message="2 items are waiting for client approval." />
          <Alert variant="danger"  title="Publish failed" message="WordPress connection timed out." action={{ label: 'Retry', onClick: () => {} }} />
          <Alert variant="info"    message="Staging deployment is in progress. This may take 2–3 minutes." />
        </div>
      </Section>

      {/* ── LOADING ── */}
      <Section title="Loading states">
        <Row>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </Row>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </Section>

      {/* ── MODALS ── */}
      <Section title="Modals">
        <Row>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open confirm dialog
          </Button>
        </Row>
      </Section>

      {/* ── MODAL INSTANCES ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit project"
        subtitle="Update the project details below"
        size="md"
        footer={
          <>
            <Button variant="ghost"   onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>Save changes</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Project name" placeholder="SEO May 2026" />
          <Select
            label="Client"
            options={[{ value: 'puriva', label: 'Puriva Clinic' }]}
          />
          <Textarea label="Notes" placeholder="Add context for the team..." />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Delete project?"
        description="This will permanently remove the project and all associated deliverables. This action cannot be undone."
        confirmLabel="Delete project"
        cancelLabel="Keep project"
        danger
      />
    </div>
  );
};

export default DesignShowcase;
