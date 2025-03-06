import React, { useEffect, useState, useRef } from 'react';

const MacTerminal = () => {
  const [time, setTime] = useState('');
  const staticText = `Last login: ${time} on ttys000
Welcome to [Software Engineer] Mia Princz's portfolio website.

`;

  const command = `showcase -portfolio`;
  const [typedCommand, setTypedCommand] = useState("");

  // Ref to store the interval ID so we can delete it later
  const intervalIdRef = useRef(null);
  // Ref to ensure the effect only runs once
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    intervalIdRef.current = setInterval(() => {
      setTypedCommand(prev => {
        const nextIndex = prev.length;
        if (nextIndex < command.length) {
          return prev + command[nextIndex];
        } else {
          clearInterval(intervalIdRef.current);
          return prev;
        }
      });
    }, 100);

    setTime(new Date().toLocaleString());

    return () => clearInterval(intervalIdRef.current);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 rounded-lg shadow-lg overflow-hidden bg-black/20">
      {/* MAC terminal buttons */}
      <div className="bg-gray-200 px-4 py-2 flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF605C" }}></div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFBD44" }}></div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00CA4E" }}></div>
      </div>
      {/* Terminal content */}
      <div className="p-6 text-white/90 font-mono">
        <pre className="whitespace-pre-wrap break-words">{staticText}</pre>
        <div>
          <span>Mia Princz$ </span>
          <span>{typedCommand}</span>
          <span className="blinking-cursor">|</span>
        </div>
      </div>
      {/* Blinking cursor animation with inline CSS */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.1%, 100% { opacity: 0; }
        }
        .blinking-cursor {
          animation: blink 1s step-start infinite;
        }
      `}</style>
    </div>
  );
};

export default MacTerminal;
