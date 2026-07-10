import type { ReactNode } from "react";

export type ShellNavigationItem = {
  view: string;
  label: string;
  section: string;
  icon?: ReactNode;
};

export type ShellTenant = {
  name: string;
  slug: string;
} | null;

export type ShellUser = {
  email: string;
  name?: string | null;
};

export type ShellVariant = "admin" | "portal";
