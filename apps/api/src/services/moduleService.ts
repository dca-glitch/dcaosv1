import { moduleRegistry } from "@dca-os-v1/shared";
import type { AppModuleContract } from "@dca-os-v1/shared";

export type ModuleListItem = {
  key: string;
  name: string;
  description: string;
  status: string;
  version: string;
};

export function listModules(): ModuleListItem[] {
  return Object.values(moduleRegistry).map((moduleDefinition) => ({
    key: moduleDefinition.metadata.key,
    name: moduleDefinition.metadata.name,
    description: moduleDefinition.metadata.description,
    status: moduleDefinition.metadata.status,
    version: moduleDefinition.metadata.version
  }));
}

export function getModule(key: string): AppModuleContract | undefined {
  return moduleRegistry[key];
}
