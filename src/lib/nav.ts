export type NavItem = {
  label: string;
  href: `#${string}`;
};

/**
 * Main navigation. Each label is a short form of its section's eyebrow (for
 * example "Projects" for "Selected projects"). The projects entry appears
 * only when there is at least one project to show, so the section and its link
 * disappear together.
 */
export function buildNavItems(options: { hasProjects: boolean }): NavItem[] {
  return [
    { label: "Work", href: "#work" },
    { label: "Academic", href: "#academic" },
    ...(options.hasProjects
      ? [{ label: "Projects", href: "#projects" } as NavItem]
      : []),
    { label: "Teaching", href: "#teaching" },
    { label: "Hobbies", href: "#off-the-clock" },
    { label: "Contact", href: "#contact" },
  ];
}
