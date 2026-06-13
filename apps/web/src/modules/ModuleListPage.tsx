import type { AppModuleContract } from "@dca-os-v1/shared";
import { EmptyState } from "../components/EmptyState";

type ModuleListPageProps = {
  moduleDefinition: AppModuleContract;
};

export function ModuleListPage({ moduleDefinition }: ModuleListPageProps) {
  const fields = moduleDefinition.crud?.fields ?? [];

  if (fields.length === 0) {
    return <EmptyState title="No fields configured" message="This module does not expose a list contract yet." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.key}>{field.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {fields.map((field) => (
              <td key={field.key}>Placeholder {field.label.toLowerCase()}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
