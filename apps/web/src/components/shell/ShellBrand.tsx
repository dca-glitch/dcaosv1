import type { ShellVariant } from "./types";

type ShellBrandProps = {
  isClientRole?: boolean;
  shellVariant: ShellVariant;
};

export function ShellBrand({ isClientRole = false, shellVariant }: ShellBrandProps) {
  const isPortal = shellVariant === "portal";
  const subtitle = isPortal || isClientRole ? "Client workspace" : "Agency workspace";

  return (
    <div className="sidebar-brand brand shell-brand">
      <span className="brand-mark" aria-hidden="true">
        DCA
      </span>
      <span className="brand-copy">
        <strong>DCA OS Lite</strong>
        <small>{subtitle}</small>
      </span>
    </div>
  );
}
