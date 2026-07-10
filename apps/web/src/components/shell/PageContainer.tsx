import type { ReactNode } from "react";
import type { ShellVariant } from "./types";

type PageContainerProps = {
  shellVariant: ShellVariant;
  children: ReactNode;
};

/**
 * Page content container with density-aware gutters.
 * Admin: 28px (px-7). Portal: 32px (px-8).
 * Does not replace existing PageHeader API inside pages.
 */
export function PageContainer({ shellVariant, children }: PageContainerProps) {
  const isPortal = shellVariant === "portal";

  return (
    <div
      className={
        isPortal
          ? "shell-page-container shell-page-container--portal"
          : "shell-page-container shell-page-container--admin"
      }
      data-density={isPortal ? "comfortable" : "compact"}
    >
      {children}
    </div>
  );
}
