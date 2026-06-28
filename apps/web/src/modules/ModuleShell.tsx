import type { AppModuleContract } from "@dca-os-v1/shared";
import { PageHeader } from "../components/ui";

type ModuleShellProps = {
  moduleDefinition: AppModuleContract;
  children: React.ReactNode;
};

export function ModuleShell({ moduleDefinition, children }: ModuleShellProps) {
  return (
    <section className="module-shell view-section" id={moduleDefinition.metadata.key}>
      <PageHeader
        eyebrow={moduleDefinition.metadata.status}
        meta={<span className="muted-text">v{moduleDefinition.metadata.version}</span>}
        title={moduleDefinition.metadata.name}
        titleId={`${moduleDefinition.metadata.key}-title`}
      />
      {children}
    </section>
  );
}
