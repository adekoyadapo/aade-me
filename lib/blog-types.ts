export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  updated?: string; // optional ISO date of last substantive update
  readTime: string; // e.g., "5 min read"
  tags: readonly string[];
  content: string; // markdown body
  author: string;
  imageUrl: string;
  imageAlt: string;
}

