import React from 'react';
import ProjectCard from './ProjectCard';
import { projects } from '../constants';

const Projects = () => {
    return (
        <div className="w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-6xl mx-auto p-6 md:my-8 mb-6 lg:mt-12 flex flex-col items-center" id="projects">
            <h2 className="text-3xl min-[430px]:text-4xl md:text-6xl font-bold text-stone-200 pb-4 relative transform transition-transform duration-300 group">
                    Previous & Current Projects
                <span className="absolute left-0 right-0 h-[2px] bg-white -bottom-1 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
            </h2>
            <div className="flex flex-col pt-16 gap-6 w-full">
            {projects.map((project, index) => (
                <ProjectCard project={project} key={project.id} index={index} />
            ))}
            </div>
        </div>
    );
};
  
export default Projects;