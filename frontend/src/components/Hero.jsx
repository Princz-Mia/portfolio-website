import BongoCat from './BongoCat/BongoCat';
import { motion } from 'framer-motion';
import { ReactSocialMediaIcons } from 'react-social-media-icons';
import DrawOutlineButton from './DrawOutlineButton';
import { useState } from 'react';
import MacTerminal from './MacTerminal';

const Hero = () => {
  const codeText = `<h2>
      Mia Princz, Software Engineer
</h2>`;

  const iconVariants = {
    hidden: { x: -100, opacity: 0, rotate: -360 },
    visible: (index) => ({
      x: 0,
      opacity: 1,
      rotate: 0,
      transition: { delay: index * 0.2, duration: 0.5, ease: 'easeOut' },
    }),
  };

  const labelVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const glowEffect = {
    initial: { boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    glowing: {
      boxShadow: [
        "0px 0px 5px rgba(255, 255, 255, 0.2)",
        "0px 0px 10px rgba(255, 255, 255, 0.4)",
        "0px 0px 15px rgba(255, 255, 255, 0.6)",
        "0px 0px 10px rgba(255, 255, 255, 0.4)",
        "0px 0px 5px rgba(255, 255, 255, 0.2)"
      ],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  return (
    <section className="w-full min-h-screen pt-8 sm:pt-20 md:pt-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl flex flex-col p-6 mx-4">
        <MacTerminal />

        <div className="flex justify-around w-full mt-8">
          <div className="flex justify-evenly w-full">
            {[{ icon: "mail", label: "Email", url: "https://example.com/email" },
              { icon: "github", label: "GitHub", url: "https://example.com/github" },
              { icon: "linkedin", label: "LinkedIn", url: "https://example.com/linkedin" },
            ].map(({ icon, label, url }, index) => {
              const [isHovered, setIsHovered] = useState(false);
              return (
                <motion.div
                  key={index}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={iconVariants}
                  className="relative flex flex-col items-center"
                >
                  <motion.div
                    className="w-8 h-8 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/20 shadow-lg relative"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    animate={isHovered ? "glowing" : "initial"}
                    variants={glowEffect}
                    style={{
                      width: "clamp(40px, 8vw, 64px)",
                      height: "clamp(40px, 8vw, 64px)",
                      borderRadius: "50%",
                    }}
                  >
                    <ReactSocialMediaIcons
                      borderColor="rgba(0,0,0,0)"
                      icon={icon}
                      iconColor="rgba(255,255,255,1)"
                      backgroundColor="transparent"
                      url={url}
                      size={"clamp(32px, 5vw, 48px)"}
                      title=""
                    />
                  </motion.div>
                  <motion.div
                    initial="hidden"
                    animate={isHovered ? "visible" : "hidden"}
                    variants={labelVariants}
                    className="absolute top-15 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-md"
                  >
                    {label}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-around w-full">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <DrawOutlineButton>View Resume</DrawOutlineButton>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-2xl xl:w-3xl 2xl:w-4xl max-w-6xl flex items-center xl:pt-24 md:pt-12 sm:mt-16 md:mt-8">
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