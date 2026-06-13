import type { AppModuleContract } from "@dca-os-v1/shared";
import { ModuleDetailPage } from "../modules/ModuleDetailPage";
import { ModuleFormPage } from "../modules/ModuleFormPage";
import { ModuleListPage } from "../modules/ModuleListPage";
import { ModuleShell } from "../modules/ModuleShell";

type ModulePageProps = {
  moduleDefinition: AppModuleContract;
};

export function ModulePage({ moduleDefinition }: ModulePageProps) {
  return (
    <ModuleShell moduleDefinition={moduleDefinition}>
      <div className="module-grid">
        <ModuleListPage moduleDefinition={moduleDefinition} />
        <ModuleDetailPage moduleDefinition={moduleDefinition} />
        <ModuleFormPage moduleDefinition={moduleDefinition} />
      </div>
    </ModuleShell>
  );
}
