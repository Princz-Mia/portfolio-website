import {
  academic,
  personal,
  profile,
  projects,
  roles,
  site,
  teaching,
  technical,
} from "@/content";
import { buildNavItems } from "@/lib/nav";
import { SkipLink } from "@/components/SkipLink";
import { RevealObserver } from "@/components/RevealObserver";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Intro } from "@/components/sections/Intro";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Academic } from "@/components/sections/Academic";
import { Teaching } from "@/components/sections/Teaching";
import { Personal } from "@/components/sections/Personal";
import { Contact } from "@/components/sections/Contact";

export default function HomePage() {
  const hasProjects = projects.length > 0;
  const navItems = buildNavItems({ hasProjects });

  // Work is section 01 with its drawing on the right. Every later section takes
  // the next number and the opposite side, so both stay consistent whether or
  // not the projects section is shown.
  const later = [
    "academic",
    ...(hasProjects ? ["projects"] : []),
    "teaching",
    "personal",
    "contact",
  ];
  const slot = (key: string) => {
    const position = later.indexOf(key) + 1;
    return {
      number: String(position + 1).padStart(2, "0"),
      side: position % 2 === 1 ? ("left" as const) : ("right" as const),
    };
  };
  const academicSlot = slot("academic");
  const projectsSlot = hasProjects ? slot("projects") : null;
  const teachingSlot = slot("teaching");
  const personalSlot = slot("personal");
  const contactSlot = slot("contact");

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: `${site.url}/`,
    email: `mailto:${site.email}`,
    jobTitle: "Software Engineer",
    worksFor: { "@type": "Organization", name: "Ericsson" },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Budapest University of Technology and Economics",
    },
    sameAs: [site.github.href, site.linkedin.href],
  };

  return (
    <>
      <SkipLink />
      <div id="top" />
      <SiteHeader name={site.name} items={navItems} />
      <main id="main">
        <Intro site={site} profile={profile} hasProjects={hasProjects} />
        <Experience roles={roles} technical={technical} />
        <Academic academic={academic} {...academicSlot} />
        {projectsSlot ? <Projects projects={projects} {...projectsSlot} /> : null}
        <Teaching
          teaching={teaching}
          teachingSiteUrl={site.teachingSiteUrl}
          email={site.email}
          {...teachingSlot}
        />
        <Personal personal={personal} {...personalSlot} />
        <Contact site={site} {...contactSlot} />
      </main>
      <SiteFooter site={site} />
      <RevealObserver />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
    </>
  );
}
