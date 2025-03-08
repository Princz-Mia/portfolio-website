import React from 'react';
import { education } from '../constants';
import { motion } from 'framer-motion';

export default function App() {
  return (
    <div>
        <h2 className="text-3xl min-[430px]:text-4xl md:text-5xl font-bold text-stone-200 pb-6">Education</h2>
        <motion.ol 
            initial={{ opacity: 0, x: 90, y: 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="border-l border-neutral-300 dark:border-neutral-500">
            {education.map((item, index) => {
                return (
                <li key={index}>
                    <div className="flex-start flex items-center pt-2">
                    <div className="-ml-[5px] mr-3 h-[9px] w-[9px] rounded-full bg-neutral-300 dark:bg-neutral-500"></div>
                    <p className="text-sm text-stone-200/70">
                        {item.fromTo}
                    </p>
                    </div>
                    <div className="mb-6 ml-4 mt-2">
                    <h4 className="mb-2 text-xl font-semibold uppercase text-stone-200">
                        {item.title}
                    </h4>
                    {item.bulletPoints.map((point, index) => {
                        return (
                            <p key={index} className="mb-3 text-stone-200/70">
                                {point}
                            </p>
                        )
                    })}
                    </div>
                </li>
                );
            })}
        </motion.ol >
    </div>
  );
}