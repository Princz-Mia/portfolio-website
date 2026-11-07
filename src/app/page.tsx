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

  // Section numbers stay consecutive whether or not the projects section is shown.
  let counter = 1;
  const next = () => String(++counter).padStart(2, "0");
  const projectsNumber = hasProjects ? next() : null;
  const academicNumber = next();
  const teachingNumber = next();
  const personalNumber = next();
  const contactNumber = next();

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
        {projectsNumber ? <Projects projects={projects} /> : null}
        <Academic academic={academic} number={academicNumber} />
        <Teaching
          teaching={teaching}
          teachingSiteUrl={site.teachingSiteUrl}
          email={site.email}
          number={teachingNumber}
        />
        <Personal personal={personal} number={personalNumber} />
        <Contact site={site} number={contactNumber} />
      </main>
      <SiteFooter site={site} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
    </>
  );
}
