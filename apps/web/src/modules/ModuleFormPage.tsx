import type { AppModuleContract } from "@dca-os-v1/shared";

type ModuleFormPageProps = {
  moduleDefinition: AppModuleContract;
};

export function ModuleFormPage({ moduleDefinition }: ModuleFormPageProps) {
  const fields = moduleDefinition.crud?.fields ?? [];

  return (
    <form className="form-grid">
      {fields.map((field) => (
        <label key={field.key}>
          <span>{field.label}</span>
          {field.type === "textarea" ? (
            <textarea placeholder={field.placeholder} />
          ) : (
            <input type={field.type === "email" ? "email" : "text"} placeholder={field.placeholder} />
          )}
        </label>
      ))}
    </form>
  );
}
