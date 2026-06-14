export interface CompanyProfileSummary {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  billingAddress: string | null;
  paymentInstructions: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileResponse {
  companyProfile: CompanyProfileSummary | null;
}

export interface CompanyProfileUpdateRequest {
  name?: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;
  billingAddress?: string | null;
  paymentInstructions?: string | null;
  logoUrl?: string | null;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  billingDetails: string | null;
  contactPerson: string | null;
  notes: string | null;
  isArchived: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientResponse {
  client: ClientSummary | null;
}

export interface ClientsResponse {
  clients: ClientSummary[];
}

export interface ClientInputRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  billingDetails?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
}

export interface ProjectSummary {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  };
  name: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  isArchived: boolean;
  taskCount: number;
  openTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  project: ProjectSummary | null;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
}

export interface ProjectInputRequest {
  clientId?: string;
  name?: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface TaskSummary {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  recurringType: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  task: TaskSummary | null;
}

export interface TasksResponse {
  tasks: TaskSummary[];
}

export interface TaskInputRequest {
  projectId?: string;
  title?: string;
  description?: string | null;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  recurringType?: string;
}
