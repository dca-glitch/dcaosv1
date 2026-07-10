export function portalSectionLabel(section: string): string {
  if (section === "client") {
    return "Archive";
  }

  return section === "protected" ? "Overview" : section;
}

export function adminSectionLabel(section: string): string {
  return section === "protected" ? "Product" : section;
}
