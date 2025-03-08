import React from 'react';
import { motion } from 'framer-motion';

const ProjectCard = ({ project, index }) => {
  // Határozzuk meg, hogy a kártya páros (balról) vagy páratlan (jobbról) érkezzen
  const isEven = index % 2 === 0;
  
  // A kezdő x érték – a kisebb értékekkel lehet finomhangolni az animációt
  const initialX = isEven ? -200 : 200;

  // Variánsok a framer-motion számára
  const variants = {
    hidden: { opacity: 0, x: initialX },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 1 }
    }
  };

  // Nagyobb képernyőkön (1024px felett) a kártya 50%-os szélességű lesz, és az igazítás határozza meg,
  // hogy balról vagy jobbról érkezzen
  const alignmentClass = isEven ? 'lg:mr-auto' : 'lg:ml-auto';

  return (
    <motion.div
      className={`bg-gray-800 lg:mb-6 rounded-lg shadow-lg p-6 flex flex-col lg:flex-row items-center xl:items-start w-full lg:w-3/5 ${alignmentClass}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
    >
      {/* Kisebb képernyőkön: a horizontális kép, a kártya tetején; 1280px felett: vertikális kép, 
          amely a kártya bal oldalán fél szélességben, teljes magasságban jelenik meg */}
      <picture className="w-full xl:w-1/2 xl:h-full rounded-md overflow-hidden">
        <source media="(min-width: 1280px)" srcSet={project.imageUrlVertical} />
        <img
          src={project.imageUrlHorizontal}
          alt={project.title}
          className="w-full h-auto xl:h-96 object-cover rounded-md"
        />
      </picture>
      <div className="mt-4 lg:mt-0 lg:ml-6 xl:w-1/2">
        <h3 className="text-xl font-semibold text-white">{project.title}</h3>
        <p className="text-gray-300 mt-2">{project.description}</p>
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
