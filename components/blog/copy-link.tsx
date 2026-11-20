"use client";

import { useState } from "react";
import { Link as LinkIcon } from "@/components/icons";

/** The only interactive part of the share row; X and LinkedIn are plain links rendered on the server. */
export default function CopyLink({ url, className }: { url: string; className: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" onClick={copy} className={className} aria-label="Copy link">
      <LinkIcon className="h-3.5 w-3.5" />
      <span role="status">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}
