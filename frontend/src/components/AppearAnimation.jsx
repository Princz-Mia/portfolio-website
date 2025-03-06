import React, { useEffect, useRef, useState } from "react";

const AppearAnimation = ({ children }) => {
  const panelRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.4 } // 40%-os láthatóság után indul az animáció
    );
    if (panelRef.current) {
      observer.observe(panelRef.current);
    }
    return () => {
      if (panelRef.current) {
        observer.unobserve(panelRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className={`w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-6xl flex mx-auto p-6 md:my-8 mb-6 lg:mt-12 bg-black/20 border-2 border-black/20 rounded shadow-lg transform transition-all duration-500 ease-in-out 
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      {children}
    </div>
  );
}

export default AppearAnimation;