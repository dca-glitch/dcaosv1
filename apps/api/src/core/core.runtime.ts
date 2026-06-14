import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type {
  ClientInputRequest,
  ClientResponse,
  ClientsResponse,
  CompanyProfileResponse,
  CompanyProfileUpdateRequest,
  ProjectInputRequest,
  ProjectResponse,
  ProjectsResponse,
  TaskInputRequest,
  TaskResponse,
  TasksResponse
} from "./core.types";
import type { AuthResolvedSessionContext } from "../auth/types";

const prisma = createPrismaClient();

type PrismaTx = Prisma.TransactionClient;
type TaskPriority = "LOW" | "NORMAL" | "HIGH";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskRecurringType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

function toNullableString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toDateString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toCompanyProfileSummary(profile: {
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
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: profile.id,
    name: profile.name,
    legalName: profile.legalName,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    taxId: profile.taxId,
    registrationNumber: profile.registrationNumber,
    billingAddress: profile.billingAddress,
    paymentInstructions: profile.paymentInstructions,
    logoUrl: profile.logoUrl,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function toClientSummary(client: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  billingDetails: string | null;
  contactPerson: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    projects: number;
  };
}) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    website: client.website,
    billingDetails: client.billingDetails,
    contactPerson: client.contactPerson,
    notes: client.notes,
    isArchived: client.isArchived,
    projectCount: client._count.projects,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString()
  };
}

function toProjectSummary(project: {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  };
  name: string;
  description: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    tasks: number;
  };
  taskCount?: number;
  openTaskCount?: number;
}) {
  return {
    id: project.id,
    clientId: project.clientId,
    client: {
      id: project.client.id,
      name: project.client.name
    },
    name: project.name,
    description: project.description,
    startDate: toDateString(project.startDate),
    dueDate: toDateString(project.dueDate),
    isArchived: project.isArchived,
    taskCount: project.taskCount ?? project._count?.tasks ?? 0,
    openTaskCount: project.openTaskCount ?? 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

function toTaskSummary(task: {
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
  dueDate: Date | null;
  recurringType: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    projectId: task.projectId,
    project: {
      id: task.project.id,
      name: task.project.name,
      client: {
        id: task.project.client.id,
        name: task.project.client.name
      }
    },
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: toDateString(task.dueDate),
    recurringType: task.recurringType,
    isArchived: task.isArchived,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

export async function getCompanyProfile(): Promise<CompanyProfileResponse> {
  const companyProfile = await prisma.companyProfile.findFirst({
    where: {
      isActive: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return {
    companyProfile: companyProfile ? toCompanyProfileSummary(companyProfile) : null
  };
}

export async function saveCompanyProfile(
  input: Required<Pick<CompanyProfileUpdateRequest, "name">> & CompanyProfileUpdateRequest
): Promise<CompanyProfileResponse> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.companyProfile.findFirst({
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true
      }
    });

    if (existing) {
      const updated = await tx.companyProfile.update({
        where: {
          id: existing.id
        },
        data: {
          name: input.name,
          legalName: toNullableString(input.legalName),
          email: toNullableString(input.email),
          phone: toNullableString(input.phone),
          website: toNullableString(input.website),
          taxId: toNullableString(input.taxId),
          registrationNumber: toNullableString(input.registrationNumber),
          billingAddress: toNullableString(input.billingAddress),
          paymentInstructions: toNullableString(input.paymentInstructions),
          logoUrl: toNullableString(input.logoUrl),
          isActive: true
        }
      });

      await tx.companyProfile.updateMany({
        where: {
          id: {
            not: updated.id
          }
        },
        data: {
          isActive: false
        }
      });

      return {
        companyProfile: toCompanyProfileSummary(updated)
      };
    }

    const created = await tx.companyProfile.create({
      data: {
        name: input.name,
        legalName: toNullableString(input.legalName),
        email: toNullableString(input.email),
        phone: toNullableString(input.phone),
        website: toNullableString(input.website),
        taxId: toNullableString(input.taxId),
        registrationNumber: toNullableString(input.registrationNumber),
        billingAddress: toNullableString(input.billingAddress),
        paymentInstructions: toNullableString(input.paymentInstructions),
        logoUrl: toNullableString(input.logoUrl),
        isActive: true
      }
    });

    await tx.companyProfile.updateMany({
      where: {
        id: {
          not: created.id
        }
      },
      data: {
        isActive: false
      }
    });

    return {
      companyProfile: toCompanyProfileSummary(created)
    };
  });
}

export async function listClients(
  authSession: AuthResolvedSessionContext
): Promise<ClientsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const clients = await prisma.client.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      website: true,
      billingDetails: true,
      contactPerson: true,
      notes: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });

  return {
    clients: clients.map(toClientSummary)
  };
}

async function getClientRecord(tx: PrismaTx, tenantId: string, clientId: string) {
  return tx.client.findFirst({
    where: {
      id: clientId,
      tenantId
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      website: true,
      billingDetails: true,
      contactPerson: true,
      notes: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });
}

export async function getClient(authSession: AuthResolvedSessionContext, clientId: string): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const client = await prisma.$transaction(async (tx: PrismaTx) => getClientRecord(tx, tenantId, clientId));

  return {
    client: client ? toClientSummary(client) : null
  };
}

export async function createClient(
  authSession: AuthResolvedSessionContext,
  input: ClientInputRequest
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const created = await tx.client.create({
      data: {
        tenantId,
        name: input.name ?? "",
        email: toNullableString(input.email),
        phone: toNullableString(input.phone),
        website: toNullableString(input.website),
        billingDetails: toNullableString(input.billingDetails),
        contactPerson: toNullableString(input.contactPerson),
        notes: toNullableString(input.notes)
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(created)
    };
  });
}

export async function updateClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  input: ClientInputRequest
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getClientRecord(tx, tenantId, clientId);
    if (!existing) {
      return null;
    }

    const updated = await tx.client.update({
      where: {
        id: clientId
      },
      data: {
        name: input.name ?? existing.name,
        email: toNullableString(input.email),
        phone: toNullableString(input.phone),
        website: toNullableString(input.website),
        billingDetails: toNullableString(input.billingDetails),
        contactPerson: toNullableString(input.contactPerson),
        notes: toNullableString(input.notes)
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(updated)
    };
  });
}

export async function archiveClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getClientRecord(tx, tenantId, clientId);
    if (!existing) {
      return null;
    }

    const archived = await tx.client.update({
      where: {
        id: clientId
      },
      data: {
        isArchived: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        notes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(archived)
    };
  });
}

export async function listProjects(
  authSession: AuthResolvedSessionContext
): Promise<ProjectsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const projects = await prisma.project.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true
        }
      },
      name: true,
      description: true,
      startDate: true,
      dueDate: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });

  const openTaskCounts = await Promise.all(
    projects.map(async (project) => ({
      projectId: project.id,
      openTaskCount: await prisma.task.count({
        where: {
          tenantId,
          projectId: project.id,
          isArchived: false,
          status: {
            in: ["TODO", "IN_PROGRESS"]
          }
        }
      })
    }))
  );

  const openTaskCountByProjectId = new Map(
    openTaskCounts.map((entry) => [entry.projectId, entry.openTaskCount])
  );

  return {
    projects: projects.map((project) =>
      toProjectSummary({
        ...project,
        taskCount: project._count.tasks,
        openTaskCount: openTaskCountByProjectId.get(project.id) ?? 0
      })
    )
  };
}

async function getProjectRecord(tx: PrismaTx, tenantId: string, projectId: string) {
  return tx.project.findFirst({
    where: {
      id: projectId,
      tenantId
    },
    select: {
      id: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true
        }
      },
      name: true,
      description: true,
      startDate: true,
      dueDate: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });
}

export async function getProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const project = await prisma.$transaction(async (tx: PrismaTx) => getProjectRecord(tx, tenantId, projectId));

  if (!project) {
    return {
      project: null
    };
  }

  const openTaskCount = await prisma.task.count({
    where: {
      projectId: project.id,
      tenantId,
      isArchived: false,
      status: {
        in: ["TODO", "IN_PROGRESS"]
      }
    }
  });

  return {
    project: toProjectSummary({
      ...project,
      taskCount: project._count.tasks,
      openTaskCount
    })
  };
}

export async function createProject(
  authSession: AuthResolvedSessionContext,
  input: ProjectInputRequest
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const client = await tx.client.findFirst({
      where: {
        id: input.clientId,
        tenantId
      },
      select: {
        id: true
      }
    });

    if (!client) {
      return null;
    }

    const created = await tx.project.create({
      data: {
        tenantId,
        clientId: client.id,
        name: input.name ?? "",
        description: toNullableString(input.description),
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    return {
      project: toProjectSummary({
        ...created,
        openTaskCount: 0
      })
    };
  });
}

export async function updateProject(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  input: ProjectInputRequest
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getProjectRecord(tx, tenantId, projectId);
    if (!existing) {
      return null;
    }

    const client = await tx.client.findFirst({
      where: {
        id: input.clientId,
        tenantId
      },
      select: {
        id: true
      }
    });

    if (!client) {
      return null;
    }

    const updated = await tx.project.update({
      where: {
        id: projectId
      },
      data: {
        clientId: client.id,
        name: input.name ?? existing.name,
        description: toNullableString(input.description),
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    const openTaskCount = await tx.task.count({
      where: {
        projectId: updated.id,
        tenantId,
        isArchived: false,
        status: {
          in: ["TODO", "IN_PROGRESS"]
        }
      }
    });

    return {
      project: toProjectSummary({
        ...updated,
        taskCount: updated._count.tasks,
        openTaskCount
      })
    };
  });
}

export async function archiveProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getProjectRecord(tx, tenantId, projectId);
    if (!existing) {
      return null;
    }

    const archived = await tx.project.update({
      where: {
        id: projectId
      },
      data: {
        isArchived: true
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    const openTaskCount = await tx.task.count({
      where: {
        projectId: archived.id,
        tenantId,
        isArchived: false,
        status: {
          in: ["TODO", "IN_PROGRESS"]
        }
      }
    });

    return {
      project: toProjectSummary({
        ...archived,
        taskCount: archived._count.tasks,
        openTaskCount
      })
    };
  });
}

export async function listTasks(
  authSession: AuthResolvedSessionContext
): Promise<TasksResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      title: true,
      description: true,
      priority: true,
      status: true,
      dueDate: true,
      recurringType: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    tasks: tasks.map(toTaskSummary)
  };
}

async function getTaskRecord(tx: PrismaTx, tenantId: string, taskId: string) {
  return tx.task.findFirst({
    where: {
      id: taskId,
      tenantId
    },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      title: true,
      description: true,
      priority: true,
      status: true,
      dueDate: true,
      recurringType: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function getTask(
  authSession: AuthResolvedSessionContext,
  taskId: string
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const task = await prisma.$transaction(async (tx: PrismaTx) => getTaskRecord(tx, tenantId, taskId));

  return {
    task: task ? toTaskSummary(task) : null
  };
}

export async function createTask(
  authSession: AuthResolvedSessionContext,
  input: TaskInputRequest
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.projectId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.project.findFirst({
      where: {
        id: input.projectId,
        tenantId
      },
      select: {
        id: true
      }
    });

    if (!project) {
      return null;
    }

    const created = await tx.task.create({
      data: {
        tenantId,
        projectId: project.id,
        title: input.title ?? "",
        description: toNullableString(input.description),
        priority: (input.priority as TaskPriority) ?? "NORMAL",
        status: (input.status as TaskStatus) ?? "TODO",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        recurringType: (input.recurringType as TaskRecurringType) ?? "NONE"
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(created)
    };
  });
}

export async function updateTask(
  authSession: AuthResolvedSessionContext,
  taskId: string,
  input: TaskInputRequest
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.projectId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getTaskRecord(tx, tenantId, taskId);
    if (!existing) {
      return null;
    }

    const project = await tx.project.findFirst({
      where: {
        id: input.projectId,
        tenantId
      },
      select: {
        id: true
      }
    });

    if (!project) {
      return null;
    }

    const updated = await tx.task.update({
      where: {
        id: taskId
      },
      data: {
        projectId: project.id,
        title: input.title ?? existing.title,
        description: toNullableString(input.description),
        priority: (input.priority as TaskPriority) ?? existing.priority,
        status: (input.status as TaskStatus) ?? existing.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        recurringType: (input.recurringType as TaskRecurringType) ?? existing.recurringType
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(updated)
    };
  });
}

export async function archiveTask(
  authSession: AuthResolvedSessionContext,
  taskId: string
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getTaskRecord(tx, tenantId, taskId);
    if (!existing) {
      return null;
    }

    const archived = await tx.task.update({
      where: {
        id: taskId
      },
      data: {
        isArchived: true
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(archived)
    };
  });
}
