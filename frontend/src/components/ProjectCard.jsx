import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProjectCard = ({ project, index }) => {
  // Figyeljük az ablakméretet, hogy mobil nézet-e (kevesebb, mint 1024px)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize(); // kezdeti ellenőrzés
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Határozzuk meg, hogy a kártya páros (balról) vagy páratlan (jobbról) érkezzen
  const isEven = index % 2 === 0;
  // Mobil esetén nem akarunk vízszintes eltolást, így x mindig 0,
  // nem-mobil esetén pedig a régi logika szerint számolunk eltolást
  const initialX = isMobile ? 0 : (isEven ? -200 : 200);

  // Variánsok: mobilon csak y tengelyen animálunk, és x érték mindig 0
  const variants = isMobile
    ? {
        hidden: { opacity: 0, x: 0, y: 100 },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { type: 'spring', bounce: 0.2, duration: 1 },
        },
      }
    : {
        hidden: { opacity: 0, x: initialX },
        visible: {
          opacity: 1,
          x: 0,
          transition: { type: 'spring', bounce: 0.2, duration: 1 },
        },
      };

  // Mobilon a kártya középre kerül, nagyobb képernyőn az index alapján igazítjuk
  const alignmentClass = isMobile ? 'mx-auto' : (isEven ? 'lg:mr-auto' : 'lg:ml-auto');

  return (
    <motion.div
      className={`bg-black/20 border-2 border-black/20 lg:mb-6 rounded-lg shadow-lg p-6 flex flex-col lg:flex-row items-center xl:items-start w-full lg:w-3/5 ${alignmentClass}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
    >
      <picture className="w-full xl:w-1/2 xl:h-full rounded-md overflow-hidden">
        <source media="(min-width: 1280px)" srcSet={project.imageUrlVertical} />
        <img
          src={project.imageUrlHorizontal}
          alt={project.title}
          className="w-full h-auto xl:h-96 object-cover rounded-md"
        />
      </picture>
      <div className="mt-4 lg:mt-0 lg:ml-6 xl:w-1/2">
        <h3 className="text-xl font-semibold text-stone-200">{project.title}</h3>
        <p className="text-stone-200/70 mt-2">{project.description}</p>
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 mt-4 inline-block"
        >
          View on GitHub
        </a>
      </div>
    </motion.div>
  );
};

export default ProjectCard;