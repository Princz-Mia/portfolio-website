export const navigation = [
  {
    id: "0",
    title: "About Me",
    url: "#about",
  },
  {
    id: "1",
    title: "Technologies",
    url: "#technologies",
  },
  {
    id: "2",
    title: "Education",
    url: "#education",
  },
  {
    id: "3",
    title: "Projects",
    url: "#projects",
  },
];

export const aboutMeParagraphs = [
  {
    id: "0",
    content:
      "Hi, I'm Mia Princz, a final-year Computer Engineering student currently pursuing my Bachelor's degree at the Budapest University of Technology and Economics. Specializing in Software Engineering at the Department of Automation and Applied Informatics, my primary focus and passion lie in backend development, though I'm also comfortable and capable when working on frontend projects.",
  },
  {
    id: "1",
    content:
      "Throughout my academic journey, I've actively participated in diverse projects that allowed me to build robust software solutions, enhancing my skills in software development, database management, and API design. My experience includes technologies such as Java, Kotlin, .NET, various JavaScript frameworks and many more, enabling me to confidently handle end-to-end application development.",
  },
  {
    id: "2",
    content:
      "I'm highly motivated, detail-oriented, and continuously eager to expand my professional knowledge and skills. My goal is to become part of an innovative team where I can contribute effectively while growing professionally and personally. I'm always open to exciting career opportunities and collaboration — let's connect and discuss how I can bring value to your organization!",
  },
];

export const technologiesParagraph = `Throughout my previous projects and studies, I've gained hands-on experience and familiarity with a wide range of modern technologies. I'm continually expanding my knowledge by practicing and building new projects. I thrive in dynamic environments and I'm always eager to embrace new challenges, making me flexible and ready to quickly adapt to any technology stack required by the team or project.`;

export const technologyCards = [
  {
    name: "Java",
    description: "Object-oriented programming language.",
    imageUrl: "/imgs/logos/java.svg",
    bgColor: "bg-[#dfdfe0]/90",
  },
  {
    name: "Spring",
    description: "Java-based application framework.",
    imageUrl: "/imgs/logos/spring.svg",
    bgColor: "bg-[#77bc1f]/40",
  },
  {
    name: "Kotlin",
    description: "Modern, concise programming language.",
    imageUrl: "/imgs/logos/kotlin.svg",
    bgColor: "bg-[#ae27eb]/25",
  },
  {
    name: "Ktor",
    description: "Asynchronous server framework for Kotlin.",
    imageUrl: "/imgs/logos/ktor.svg",
    bgColor: "bg-[#0ba8ff]/20",
  },
  {
    name: "C#",
    description: "Microsoft's object-oriented language.",
    imageUrl: "/imgs/logos/csharp.svg",
    bgColor: "bg-[#9b4f96]/20",
  },
  {
    name: ".NET",
    description: "Microsoft's cross-platform framework.",
    imageUrl: "/imgs/logos/dotnetcore.svg",
    bgColor: "bg-[#623697]/20",
  },
  {
    name: "PostgreSQL",
    description: "Open-source relational database.",
    imageUrl: "/imgs/logos/postgresql.svg",
    bgColor: "bg-[#336791]/20",
  },
  {
    name: "MongoDB",
    description: "NoSQL document database.",
    imageUrl: "/imgs/logos/mongodb.svg",
    bgColor: "bg-[#4e9e44]/20",
  },
  {
    name: "JavaScript",
    description: "Dynamic web programming language.",
    imageUrl: "/imgs/logos/javascript.svg",
    bgColor: "bg-[#f0db4f]/20",
  },
  {
    name: "TypeScript",
    description: "Typed superset of JavaScript.",
    imageUrl: "/imgs/logos/typescript.svg",
    bgColor: "bg-[#3178c6]/20",
  },
  {
    name: "React",
    description: "JavaScript library.",
    imageUrl: "/imgs/logos/react.svg",
    bgColor: "bg-[#61DAFB]/20",
  },
  {
    name: "Tailwind",
    description: "CSS framework.",
    imageUrl: "/imgs/logos/tailwind.svg",
    bgColor: "bg-[#0EA5E9]/20",
  },
  {
    name: "Git",
    description: "Version control.",
    imageUrl: "/imgs/logos/git.svg",
    bgColor: "bg-[#F1502F]/20",
  },
  {
    name: "Swagger",
    description: "API documentation tool.",
    imageUrl: "/imgs/logos/swagger.svg",
    bgColor: "bg-[#85ea2d]/20",
  },
];

export const education = [
  {
    id: "0",
    fromTo: "Sept 2021 - Feb 2026",
    title:
      "Budapest University of Technology and Economics | BS in Computer Engineering",
    bulletPoints: [
      "— Pursuing Software Engineering specialization as part of my university studies",
      "— Currently working on Project Laboratory with plans for further extension and refinement as a bachelor's thesis topic",
    ],
  },
  {
    id: "1",
    fromTo: "Sept 2015 - June 2020",
    title: "Bláthy Ottó Titusz Informatics Technical College",
    bulletPoints: [
      "— Recipient of the Bláthy Award for sustained academic excellence and active participation in the school community",
      "— Supported peers in preparing for their professional final exams through tutoring and guidance",
    ],
  },
];

export const projects = [
  {
    id: "0",
    title: "Spring Coffee — E-commerce Web Application",
    description:
      "Developed as a course project for the Java-based Web Frameworks course, this application provided hands-on experience with Spring Boot, including Spring Data JPA, and Spring Security. Technologies: Java, Spring Boot, React, JavaScript, PostgreSQL, Docker",
    imageUrlVertical: "/imgs/projects/SpringCoffee_v.webp",
    imageUrlHorizontal: "/imgs/projects/SpringCoffee_h.webp",
    githubUrl: "https://github.com/Princz-Mia/viaubv18-coffee-shop",
  },
  {
    id: "1",
    title: "GourmetGo — Food Delivery Web Application",
    description:
      "Developed as part of the Project Laboratory course at BME's Department of Automation and Applied Informatics, this food ordering web application leverages Spring Boot and React. Currently under active development with plans for further extension and refinement as a bachelor’s thesis topic. Technologies: Java, Spring Boot, React, JavaScript, PostgreSQL, Docker",
    imageUrlVertical: "/imgs/projects/GourmetGo_v.webp",
    imageUrlHorizontal: "/imgs/projects/GourmetGo_h.webp",
    githubUrl: "https://github.com/Princz-Mia/viaual04-gourmetgo",
  },
  {
    id: "2",
    title: "PlanYourFuture — AI-Driven Mobile and Web Application",
    description:
      "PlanYourFuture is an AI-driven application designed to help users create personalized career and financial plans based on real-time trends and forecasts. It simulates various scenarios to guide informed decision-making. Developed for the BlackRock Application Development Competition as part of the Kotlin Multiplatform course. Currently in the planning and development phase. Technologies: Kotlin, Ktor, KMM, Kotlin/JS, React, OpenAI, PostgreSQL, Docker",
    imageUrlVertical: "/imgs/projects/PlanYourFuture_v.webp",
    imageUrlHorizontal: "/imgs/projects/PlanYourFuture_h.webp",
    githubUrl: "https://github.com/Princz-Mia/viaubxav084-planyourfuture",
  },
];
