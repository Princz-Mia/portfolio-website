import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { disablePageScroll, enablePageScroll } from "@fluejs/noscroll";

import { navigation } from "../constants";

const Navbar = () => {
  const pathname = useLocation();
  const [openNavigation, setOpenNavigation] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const toggleNavigation = () => {
    if (openNavigation) {
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const handleScroll = () => {
    if (window.scrollY > lastScrollY) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  const handleClick = () => {
    if (!openNavigation) return;
    enablePageScroll();
    setOpenNavigation(false);
  };
  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 bg-black/80 transition-transform duration-500 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <nav className={`${openNavigation ? "bg-(--bg)/40 backdrop-blur-lg" : "bg-transparent"}`}>
        <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4 relative">
          <a href="/" className="flex items-center space-x-3">
          <img
            src="/imgs/logos/self.png"
            alt="Logo"
            className="w-16 h-16 transform transition-transform duration-300 hover:scale-110"
          />
          </a>
          <button
            onClick={toggleNavigation}
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2  text-stone-200 rounded-lg"
          >
            <span className="sr-only">Toggle main menu</span>
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              {openNavigation ? (
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          <div className="hidden md:block">
            <ul className="flex space-x-8">
              {navigation.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.url}
                    onClick={handleClick}
                    className="block relative  text-stone-200/70 font-medium transform transition-transform duration-300 hover:scale-110 group hover:text-white mr-6"
                  >
                    {item.title}
                    <span className="absolute left-0 right-0 h-[2px] bg-white -bottom-1 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {openNavigation && (
        <div className="fixed h-screen inset-x-0 top-[5rem] bottom-0 bg-(--bg)/40 backdrop-blur-lg z-40 flex items-center justify-center">
          <nav>
            <div className="max-w-screen-xl mx-auto p-4">
              <ul className="font-medium flex flex-col items-center space-y-16 -mt-32">
                {navigation.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.url}
                      onClick={handleClick}
                      className="block xl:text-4xl lg:text-3xl md:text-2xl relative text-stone-200/70 font-medium transform transition-transform duration-300 hover:scale-105 group hover:text-white"
                    >
                      {item.title}
                      <span className="absolute left-0 right-0 h-[2px] bg-white -bottom-1 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;