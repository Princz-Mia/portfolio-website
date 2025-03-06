import { aboutMeParagraphs } from '../constants';

const About = () => {
  return (
    <div className='py-4 sm:py-6'>
    <h2 className="text-3xl min-[430px]:text-4xl md:text-5xl font-bold text-stone-200 pb-4">About Me</h2>
      {aboutMeParagraphs.map((item, index) => {
        return (
          <div key={index}>
            <p
              key={index}
              className="block relative text-stone-200/70 font-base transform transition-transform duration-300 group mr-6"
            >
              {item.content}
            </p>
            <br />
          </div>
        );
      })}
  </div>
  )
}

export default About