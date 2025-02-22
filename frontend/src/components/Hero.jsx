import BongoCat from './BongoCat/BongoCat';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import { ReactSocialMediaIcons } from 'react-social-media-icons';

const Hero = () => {
  const codeText = 
  `// Hello there,
var name = "Mia Princz";
var spec = "Software Engineer";`;

  const iconVariants = {
    hover: {
      scale: 1.2,
      boxShadow: "0px 0px 20px rgba(26,166,233,0.9)",
      transition: { duration: 0.3 },
    },
  };

  return (
<section className="w-full h-auto pt-20 sm:pt-20 md:pt-12 px-4 flex flex-col md:flex-row items-center justify-center bg-radial from-gray-900 from-40% to-(--bg)">
  <div className="w-full md:w-1/2 max-w-2xl flex flex-col p-6 mx-4 relative md:top-[-4em]">
    <div className="bg-gray-900 text-(--cyan) p-6 shadow-lg border-2 border-(--blue) flex flex-col items-start">
      <h2 className="font-mono text-sm md:text-lg xl:text-2xl whitespace-pre-wrap">
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
            backgroundColor="rgba(26,166,233,1)"
            url={url}
            size="64"
          />
          <span className="absolute bottom-[-40px] text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  </div>

  <div className="w-full md:w-1/2 max-w-2xl flex items-center p-6 pt-12 md:pt-36 mx-4">
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
