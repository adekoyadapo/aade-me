import { BlogPost } from "./blog-types";

/**
 * Filter blog posts by tag
 */
export function filterPostsByTag(posts: readonly BlogPost[], tag: string | null): readonly BlogPost[] {
  if (!tag || tag === "All") {
    return posts;
  }
  return posts.filter((post) => post.tags.includes(tag));
}

/**
 * Search blog posts by title and content
 */
export function searchPosts(posts: readonly BlogPost[], query: string): readonly BlogPost[] {
  if (!query.trim()) {
    return posts;
  }

  const lowerQuery = query.toLowerCase();
  return posts.filter((post) =>
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt.toLowerCase().includes(lowerQuery) ||
    post.content.toLowerCase().includes(lowerQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Sort blog posts by date (newest first)
 */
export function sortPostsByDate(posts: readonly BlogPost[]): readonly BlogPost[] {
  return [...posts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// For server-side tag loading use lib/blog-repo.getAllTags().
export function extractAllTags(posts: readonly BlogPost[]): string[] {
  const tags = new Set<string>();
  posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
