import type { AppModuleContract, ModuleRegistry } from "./modules";

export const coreModule: AppModuleContract = {
  metadata: {
    key: "core",
    name: "Core",
    description: "Platform core module registry entry.",
    status: "internal",
    version: "0.1.0"
  },
  routes: [],
  navigation: [],
  permissions: [],
  dashboardCards: []
};

export const financeLiteModule: AppModuleContract = {
  metadata: {
    key: "finance-lite",
    name: "Finance Lite",
    description: "Placeholder finance module registry entry.",
    status: "planned",
    version: "0.1.0"
  },
  routes: [],
  navigation: [],
  permissions: [],
  dashboardCards: []
};

export const userSettingsModule: AppModuleContract = {
  metadata: {
    key: "user-settings",
    name: "User Settings",
    description: "User settings module registry entry.",
    status: "active",
    version: "0.1.0"
  },
  routes: [],
  navigation: [],
  permissions: [],
  dashboardCards: []
};

export const aiDeliveryModule: AppModuleContract = {
  metadata: {
    key: "ai-delivery",
    name: "AI Delivery",
    description: "AI Delivery operational module.",
    status: "active",
    version: "0.1.0"
  },
  routes: [],
  navigation: [],
  permissions: [],
  dashboardCards: []
};

export const marketIntelligenceModule: AppModuleContract = {
  metadata: {
    key: "market-intelligence",
    name: "Market Intelligence",
    description: "Market Intelligence research module.",
    status: "active",
    version: "0.1.0"
  },
  routes: [],
  navigation: [],
  permissions: [],
  dashboardCards: []
};

export const foundationModule: AppModuleContract = coreModule;

export const moduleRegistry: ModuleRegistry = {
  [coreModule.metadata.key]: coreModule,
  [financeLiteModule.metadata.key]: financeLiteModule,
  [userSettingsModule.metadata.key]: userSettingsModule,
  [aiDeliveryModule.metadata.key]: aiDeliveryModule,
  [marketIntelligenceModule.metadata.key]: marketIntelligenceModule
};
