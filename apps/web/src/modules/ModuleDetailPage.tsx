import type { AppModuleContract } from "@dca-os-v1/shared";

type ModuleDetailPageProps = {
  moduleDefinition: AppModuleContract;
};

export function ModuleDetailPage({ moduleDefinition }: ModuleDetailPageProps) {
  return (
    <div className="detail-panel">
      <h3>{moduleDefinition.crud?.entityName ?? moduleDefinition.metadata.name} Detail</h3>
      <p>{moduleDefinition.metadata.description}</p>
    </div>
  );
}
