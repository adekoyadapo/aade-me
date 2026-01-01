"use client";

import React, { useState } from "react";
import Script from "next/script";
import SectionHeading from "./section-heading";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/hooks";
import { sendEmail } from "@/actions/sendEmail";
import SubmitBtn from "./submit-btn";
import toast from "react-hot-toast";
// reCAPTCHA removed; using lightweight anti-bot techniques instead

export default function Contact() {
  const { ref } = useSectionInView("Contact");
  // capture when the form rendered to measure human interaction time
  const [formTs] = useState<string>(() => Date.now().toString());

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    // Add a JS-only flag to help detect non-JS bots on the server.
    formData.set("js_only", "1");

    const { data, error } = await sendEmail(formData);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Email sent successfully!");
  };

  return (
    <motion.section
      id="contact"
      ref={ref}
      className="mb-20 sm:mb-28 w-[min(100%,38rem)] text-center"
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
      <SectionHeading>Contact me</SectionHeading>

      <p className="text-gray-700 -mt-6 dark:text-white/80">
        Feel free to drop me a message
      </p>

      <form
        className="mt-10 flex flex-col dark:text-black"
        onSubmit={handleFormSubmit}
      >

        {/* Honeypot field */}
        <input
          className="hidden"
          type="text"
          name="honeytrap"
          autoComplete="new-password"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input type="hidden" name="form_ts" value={formTs} />

        <input
          className="h-14 px-4 rounded-lg borderBlack dark:bg-white dark:bg-opacity-80 dark:focus:bg-opacity-100 transition-all dark:outline-none"
          name="senderEmail"
          type="email"
          required
          maxLength={500}
          placeholder="Your email"
        />
        <textarea
          className="h-52 my-3 rounded-lg borderBlack p-4 dark:bg-white dark:bg-opacity-80 dark:focus:bg-opacity-100 transition-all dark:outline-none"
          name="message"
          placeholder="Your message"
          required
          maxLength={5000}
        />
        {/* Cloudflare Turnstile */}
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        <div
          className="cf-turnstile pt-5 pb-5 flex justify-center mx-auto"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          data-theme="auto"
          data-size="flexible"
        />
        <SubmitBtn />
      </form>
    </motion.section>
  );
}
