import React from 'react';
import { education } from '../constants';

export default function App() {
  return (
    <div>
        <h2 className="text-3xl min-[430px]:text-4xl md:text-5xl font-bold text-stone-200 pb-12">Education</h2>
        <ol className="border-l border-neutral-300 dark:border-neutral-500">
            {education.map((item, index) => {
                return (
                <li key={index}>
                    <div className="flex-start flex items-center pt-2">
                    <div className="-ml-[5px] mr-3 h-[9px] w-[9px] rounded-full bg-neutral-300 dark:bg-neutral-500"></div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-300">
                        {item.fromTo}
                    </p>
                    </div>
                    <div className="mb-6 ml-4 mt-2">
                    <h4 className="mb-2 text-xl font-semibold uppercase">
                        {item.title}
                    </h4>
                    {item.bulletPoints.map((point, index) => {
                        return (
                            <p key={index} className="mb-3 text-neutral-500 dark:text-neutral-300">
                                {point}
                            </p>
                        )
                    })}
                    </div>
                </li>
                );
            })}
        </ol>
    </div>
  );
}