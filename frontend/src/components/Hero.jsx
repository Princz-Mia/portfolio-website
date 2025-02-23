import BongoCat from './BongoCat/BongoCat';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import { ReactSocialMediaIcons } from 'react-social-media-icons';

const Hero = () => {
  const codeText = 
  `<h2>
      Mia Princz, Software Engineer
</h2>`;

  const iconVariants = {
    hover: {
      scale: 1.2,
      boxShadow: "0px 0px 20px rgba(26,166,233,0.9)",
      transition: { duration: 0.3 },
    },
  };

  return (
<section className="w-full min-h-screen pt-8 sm:pt-20 md:pt-12 px-4 flex flex-col items-center justify-center">
  <div className="w-full max-w-2xl flex flex-col p-6 mx-4">
  <div className="text-(--cyan) p-6 shadow-lg border-5 border-(--blue) flex flex-col items-start relative">
  {/* Dummy elem: ez határozza meg a konténer méretét */}
  <h2 className="font-(--font-jetbrains) text-sm md:text-lg xl:text-2xl whitespace-pre-wrap select-none visibility-hidden text-(--bg)">
    {codeText}
  </h2>
  {/* Az animált Typewriter, amely abszolút helyezkedik el a dummy fölött */}
  <h2 className="font-(--font-jetbrains)text-sm md:text-lg xl:text-2xl whitespace-pre-wrap absolute">
    <Typewriter
      words={[codeText]}
      loop={1}
      cursor
      cursorStyle="|"
      typeSpeed={50}
      deleteSpeed={0}
      delaySpeed={1000}
    />
  </h2>
</div>


    <div className="flex justify-around w-full mt-12">
      {[{ icon: "mail", label: "Email", url: "https://example.com/email" },
        { icon: "github", label: "GitHub", url: "https://example.com/github" },
        { icon: "linkedin", label: "LinkedIn", url: "https://example.com/linkedin" }, ].map(({ icon, label, url }, index) => (
        <motion.div
          key={index}
          variants={iconVariants}
          whileHover="hover"
          className="relative group"
        >
          <ReactSocialMediaIcons
            borderColor="rgba(0,0,0,0.25)"
            icon={icon}
            iconColor="rgba(255,255,255,1)"
            backgroundColor="#569cfa"
            url={url}
            size="48"
          />
          <span className="absolute bottom-[-40px] text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  </div>

  <div className="w-full md:w-2xl xl:w-3xl 2xl:w-4xl max-w-6xl flex items-center xl:pt-24 pt-12">
    <motion.div
      initial={{ translateY: 100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex justify-center"
    >
      <BongoCat />
    </motion.div>
  </div>
</section>

  );
};

export default Hero;
