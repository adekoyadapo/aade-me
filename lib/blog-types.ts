export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  readTime: string; // e.g., "5 min read"
  tags: readonly string[];
  content: string; // markdown body
  author: string;
  imageUrl: string;
  imageAlt: string;
}

