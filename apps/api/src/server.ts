import {
  formatStartupEnvironmentIssue,
  formatStartupEnvironmentNotice,
  loadStartupEnvironment
} from "./config/runtime-env";
import { probeDbReadiness } from "./health/db-readiness";

async function bootstrap() {
  const envResult = loadStartupEnvironment();
  const environmentIssue = formatStartupEnvironmentIssue(envResult);

  if (environmentIssue) {
    throw new Error(environmentIssue);
  }

  const environmentNotice = formatStartupEnvironmentNotice(envResult);
  if (environmentNotice) {
    console.warn(environmentNotice);
  }

  const database = await probeDbReadiness();
  if (database.status !== "ready") {
    throw new Error(`API startup blocked. ${database.message}`);
  }

  const { createApp } = await import("./app");
  const port = Number(process.env.PORT ?? 4000);
  const app = createApp();

  app.listen(port, () => {
    console.log(`DCA OS v1 API listening on port ${port}`);
  });
}

void bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error("API startup failed.");
    console.error(error);
  }

  process.exit(1);
});
