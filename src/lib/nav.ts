export type NavItem = {
  label: string;
  href: `#${string}`;
};

/**
 * Main navigation. The projects entry appears only when there is at least one
 * project to show, so the section and its link disappear together.
 */
export function buildNavItems(options: { hasProjects: boolean }): NavItem[] {
  return [
    { label: "Work", href: "#work" },
    ...(options.hasProjects
      ? [{ label: "Projects", href: "#projects" } as NavItem]
      : []),
    { label: "Academic", href: "#academic" },
    { label: "Teaching", href: "#teaching" },
    { label: "Contact", href: "#contact" },
  ];
}
