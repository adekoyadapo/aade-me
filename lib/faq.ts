/** Extract FAQ Q&A pairs from the post's markdown content.
 *  Looks for an H2 named "FAQ" or "Frequently Asked Questions",
 *  then collects every H3 as a question and the text until
 *  the next heading as its answer. Returns null when no FAQ
 *  section exists so the caller can skip emitting FAQPage. */
export function extractFAQItems(
  content: string
): { question: string; answer: string }[] | null {
  // Find the FAQ H2
  const faqH2 = /^##\s+(FAQ|Frequently Asked Questions)\s*$/im;
  const h2Match = faqH2.exec(content);
  if (!h2Match) return null;

  // Slice content from the FAQ H2 onward
  const afterFAQ = content.slice(h2Match.index + h2Match[0].length);

  // Stop at the next H2 (or end of file)
  const nextH2 = /^##\s+/m;
  const nextH2Match = nextH2.exec(afterFAQ);
  const faqSection = nextH2Match
    ? afterFAQ.slice(0, nextH2Match.index)
    : afterFAQ;

  // Split on H3 headings
  const h3Pattern = /^###\s+(.+)$/m;
  const chunks = faqSection.split(/^(?=###\s)/m).filter(Boolean);

  const items: { question: string; answer: string }[] = [];
  for (const chunk of chunks) {
    const h3Match = h3Pattern.exec(chunk);
    if (!h3Match) continue;
    const question = h3Match[1].trim();
    // Answer is the text after the H3 line, stripped of markdown
    const answerRaw = chunk.slice(h3Match.index + h3Match[0].length).trim();
    // Remove any nested headings and leading/trailing whitespace
    const answer = answerRaw
      .replace(/^#{1,6}\s+.*/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();
    if (question && answer) items.push({ question, answer });
  }

  return items.length > 0 ? items : null;
}
