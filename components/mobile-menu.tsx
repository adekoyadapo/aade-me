"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { links } from "@/lib/data";
import Link from "next/link";
import { useActiveSectionContext } from "@/context/active-section-context";
import type { SectionName } from "@/lib/types";
import { HiHome, HiUser, HiFolder, HiCog, HiBriefcase, HiAcademicCap, HiMail, HiMenu, HiX, HiDocumentText } from "react-icons/hi";

const iconMap: { [key: string]: React.ReactElement } = {
  Home: <HiHome />,
  About: <HiUser />,
  Projects: <HiFolder />,
  Skills: <HiCog />,
  Experience: <HiBriefcase />,
  Certifications: <HiAcademicCap />,
  Blog: <HiDocumentText />,
  Contact: <HiMail />,
};

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLinkClick = (name: SectionName, hash: string) => {
    if (!hash.startsWith("/")) {
      // Only update active section for hash links, not routes
      setActiveSection(name);
      setTimeOfLastClick(Date.now());
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <motion.button
        className="fixed top-5 right-5 z-[1000] md:hidden bg-white w-[3rem] h-[3rem] bg-opacity-80 backdrop-blur-[0.5rem] border border-white border-opacity-40 shadow-lg rounded-full flex items-center justify-center hover:scale-[1.15] active:scale-105 transition-all dark:bg-gray-950 dark:border-black/40"
        onClick={toggleMenu}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isOpen ? (
          <HiX className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
        ) : (
          <HiMenu className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
        )}
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Slide-in Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            className="fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-zinc-950 shadow-2xl z-[999] md:hidden border-l border-white/40 dark:border-black/40"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex flex-col h-full pt-20 pb-8">
              {/* Menu Items */}
              <ul className="flex-1 px-6 space-y-2 overflow-y-auto">
                {links.map((link, index) => (
                  <motion.li
                    key={link.hash}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.hash.startsWith("/") ? link.hash : `/${link.hash}`}
                      onClick={() => handleLinkClick(link.name, link.hash)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                        activeSection === link.name && !link.hash.startsWith("/")
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-md"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-2xl">
                        {iconMap[link.name] || <HiFolder />}
                      </span>
                      <span className="text-base font-medium">{link.name}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {/* Footer Text */}
              <div className="px-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
                  Tap anywhere to close
                </p>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
