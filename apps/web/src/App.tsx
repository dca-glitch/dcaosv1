import { foundationModule, moduleRegistry } from "@dca-os-v1/shared";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ModulePage } from "./pages/ModulePage";

export function App() {
  return (
    <AppLayout modules={Object.values(moduleRegistry)}>
      <DashboardPage cards={foundationModule.dashboardCards} />
      <ModulePage moduleDefinition={foundationModule} />
    </AppLayout>
  );
}
