import type { AppModuleContract, ModuleRegistry } from "./modules";

export const foundationModule: AppModuleContract = {
  metadata: {
    key: "foundation",
    name: "Foundation",
    description: "Internal module demonstrating reusable module contracts.",
    status: "internal",
    version: "0.1.0"
  },
  routes: [
    {
      id: "foundation.list",
      path: "/modules/foundation",
      label: "Foundation"
    },
    {
      id: "foundation.detail",
      path: "/modules/foundation/:id",
      label: "Foundation Detail"
    }
  ],
  navigation: [
    {
      id: "nav.foundation",
      label: "Foundation",
      href: "/modules/foundation",
      moduleKey: "foundation"
    }
  ],
  permissions: [
    {
      key: "foundation:read",
      label: "Read foundation module"
    },
    {
      key: "foundation:manage",
      label: "Manage foundation module"
    }
  ],
  dashboardCards: [
    {
      id: "foundation.status",
      title: "Foundation",
      valueLabel: "Ready",
      description: "Reusable module framework placeholder.",
      moduleKey: "foundation",
      href: "/modules/foundation"
    }
  ],
  crud: {
    entityName: "Foundation Item",
    entityNamePlural: "Foundation Items",
    listPath: "/modules/foundation",
    detailPath: "/modules/foundation/:id",
    createPath: "/modules/foundation/new",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true
      },
      {
        key: "description",
        label: "Description",
        type: "textarea"
      }
    ]
  }
};

export const moduleRegistry: ModuleRegistry = {
  [foundationModule.metadata.key]: foundationModule
};
