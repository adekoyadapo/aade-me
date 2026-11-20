import React from 'react';
import Link from 'next/link';
import SectionHeading from '@/components/section-heading';
import { FaHome } from 'react-icons/fa';
import { FaMessage } from 'react-icons/fa6';

export const metadata = {
    title: { absolute: "Page not found | Ade A." },
    description: "This page does not exist. Return to the home page, the blog or the contact page of Ade A.",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <section
            id="404"
            className="rise flex flex-col justify-center items-center h-screen text-center mt-[-20vh]"
        >
            <h1 className="sr-only">Page not found</h1>
            <SectionHeading>Not Found</SectionHeading>
            <p className="text-mute">
                The page you are looking for does not exist.
            </p>
            <p className="text-mute">
                Please check the URL and try again.
            </p>
            <p className="text-mute">
                If you think this is an error, please contact the site owner.
            </p>
            <p className="text-mute">
                Thank you for your patience.
            </p>
            <Link href="/"><span className="text-xl font-bold mt-3">Ade A.</span></Link>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 px-6 text-lg font-medium mt-6">
                <Link
                    className="bg-surface p-6 text-mute hover:text-fg flex items-center gap-4 rounded-full hover:scale-[1.15] focus-visible:scale-[1.15] active:scale-105 transition cursor-pointer borderBlack"
                    href="/"
                >
                    <FaHome />
                    <span className="absolute top-0 text-fg text-sm left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        Home
                    </span>
                </Link>

                <Link
                    className="bg-surface p-6 text-mute hover:text-fg flex items-center gap-4 rounded-full hover:scale-[1.15] focus-visible:scale-[1.15] active:scale-105 transition cursor-pointer borderBlack"
                    href="/contact"
                >
                    <FaMessage />
                    <span className="absolute top-0 text-fg text-sm left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        Contact
                    </span>
                </Link>
            </div>
        </section>
    );
}
