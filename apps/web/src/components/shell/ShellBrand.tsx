import type { ShellVariant } from "./types";

type ShellBrandProps = {
  shellVariant: ShellVariant;
};

export function ShellBrand({ shellVariant }: ShellBrandProps) {
  const isPortal = shellVariant === "portal";

  return (
    <div className="sidebar-brand brand shell-brand">
      <span className="brand-mark" aria-hidden="true">
        DCA
      </span>
      <span className="brand-copy">
        <strong>{isPortal ? "Client Archive" : "DCA OS Lite"}</strong>
        <small>{isPortal ? "Read-only deliverables" : "Operations Command"}</small>
      </span>
    </div>
  );
}
