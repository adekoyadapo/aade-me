"use client";
import React from 'react';
import SectionHeading from '@/components/section-heading';
import { motion } from 'framer-motion';
import { BsLinkedin } from 'react-icons/bs';
import { FaGithubSquare, FaHome } from 'react-icons/fa';
import { FaMessage } from 'react-icons/fa6';

export default function NotFound() {
    return (
        <motion.section
            id="404"
            className="flex flex-col justify-center items-center h-screen text-center mt-[-20vh]"
            initial={{
                opacity: 0,
            }}
            whileInView={{
                opacity: 1,
            }}
            transition={{
                duration: 1,
            }}
            viewport={{
                once: true,
            }}
        >
            <SectionHeading>Not Found</SectionHeading>
            <p className="text-gray-700 dark:text-white/80">
                The page you are looking for does not exist.
            </p>
            <p className="text-gray-700 dark:text-white/80">
                Please check the URL and try again.
            </p>
            <p className="text-gray-700 dark:text-white/80">
                If you think this is an error, please contact the site owner.
            </p>
            <p className="text-gray-700 dark:text-white/80">
                Thank you for your patience.
            </p>
            <a href="#home"><span className="text-xl font-bold mt-3">Ade A.</span></a>
            <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-2 px-6 text-lg font-medium mt-6"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.1,
                }}
            >
                <a
                    className="bg-white p-6 text-gray-700 hover:text-gray-950 flex items-center gap-4 rounded-full focus:scale-[1.15] hover:scale-[1.15] active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60 
                    hover:grayscale hover:bg-gray-500 dark:hover:bg-gray-200 hover:opacity-90"
                    href="/#"
                >
                    <FaHome />
                    <span className="absolute top-0 text-zinc-100 dark:text-zinc-900 text-sm left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        Home
                    </span>
                </a>

                <a
                    className="bg-white p-6 text-gray-700 hover:text-gray-950 flex items-center gap-4 rounded-full focus:scale-[1.15] hover:scale-[1.15] active:scale-105 transition cursor-pointer borderBlack dark:bg-white/10 dark:text-white/60 
                    hover:grayscale hover:bg-gray-500 dark:hover:bg-gray-200 hover:opacity-90"
                    href="/#contact"
                >
                    <FaMessage />
                    <span className="absolute top-0 text-zinc-100 dark:text-zinc-900 text-sm left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        Contact
                    </span>
                </a>
            </motion.div>
        </motion.section>
    );
}
