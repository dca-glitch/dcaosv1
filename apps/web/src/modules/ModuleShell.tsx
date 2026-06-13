import type { AppModuleContract } from "@dca-os-v1/shared";

type ModuleShellProps = {
  moduleDefinition: AppModuleContract;
  children: React.ReactNode;
};

export function ModuleShell({ moduleDefinition, children }: ModuleShellProps) {
  return (
    <section className="module-shell" id={moduleDefinition.metadata.key}>
      <header className="section-header">
        <div>
          <p>{moduleDefinition.metadata.status}</p>
          <h2>{moduleDefinition.metadata.name}</h2>
        </div>
        <span>{moduleDefinition.metadata.version}</span>
      </header>
      {children}
    </section>
  );
}
