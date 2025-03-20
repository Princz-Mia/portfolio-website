import React, { useEffect, useRef, useState } from "react";

const AppearAnimation = ({ children, id }) => {
  const panelRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Állítsuk be a threshold értékét a képernyőméret alapján:
    // Ha a szélesség kisebb, mint például 640px (telefonos méret), akkor 0.1, különben 0.4.
    const thresholdValue = window.innerWidth < 640 ? 0.1 : 0.4;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: thresholdValue }
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
    <div id={id} className="md:pt-4 lg:pt-8">
      <div
        ref={panelRef}
        className={`w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-6xl flex mx-auto p-6 md:my-8 mb-6 bg-black/20 border-2 border-black/20 rounded shadow-lg transform transition-all duration-500 ease-in-out 
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {children}
      </div>
    </div>
  );
};

export default AppearAnimation;
