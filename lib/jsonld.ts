/** JSON for an inline ld+json script: `<` is escaped so a string value can never close the script element. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
