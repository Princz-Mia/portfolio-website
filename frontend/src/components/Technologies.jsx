"use client";

import TechnologyCard from "./TechnologyCard";
import { technologiesParagraph, technologyCards } from "../constants";
import { motion } from "framer-motion";

const Technologies = () => {
  return (
    <div className="w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto relative z-10 py-4 sm:py-6" id="about">
      <div className="space-y-4 mb-10">
        <motion.h1
          initial={{ opacity: 0, x: -75 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-3xl min-[430px]:text-4xl md:text-5xl font-bold text-stone-200"
        >
          Technologies
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -90 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm min-[430px]:text-base max-w-lg md:max-w-3xl text-stone-200/70"
        >
            {technologiesParagraph}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 75 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 items-center justify-between gap-4 lg:gap-x-8 lg:gap-y-6 xl:gap-x-12 xl:gap-y-8"
      >
        {technologyCards.map((cardItem) => (
          <TechnologyCard key={cardItem.name} cardInfo={cardItem} />
        ))}
      </motion.div>
    </div>
  );
};

export default Technologies;