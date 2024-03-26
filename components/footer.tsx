import React from "react";

export default function Footer() {
  return (
    <footer className="mb-10 px-4 text-center text-gray-500 dark:text-gray-300">
      <small className="mb-2 block text-xs">
        &copy; {new Date().getFullYear()} <a href="#home"><span className="text-sm font-bold">Ade A.</span></a> All rights reserved.
      </small>
    </footer>
  );
}
