import { Share } from "@/components/icons";
import CopyLink from "./copy-link";

type ShareButtonsProps = {
  title: string;
  url: string;
};

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const btn =
    "flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-fg hover:bg-fg hover:text-bg";
  const u = encodeURIComponent(url);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="micro flex items-center gap-2">
        <Share className="h-4 w-4" />
        Share
      </span>
      <div className="flex gap-2">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${u}`}
          target="_blank" rel="noopener noreferrer"
          className={btn}
          aria-label="Share on X (Twitter)"
        >
          X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}
          target="_blank" rel="noopener noreferrer"
          className={btn}
          aria-label="Share on LinkedIn"
        >
          LinkedIn
        </a>
        <CopyLink url={url} className={btn} />
      </div>
    </div>
  );
}
