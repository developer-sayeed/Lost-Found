/**
 * String manipulation and formatting utilities
 */

/**
 * Capitalizes the first letter of each word in a string (Title Case / CSS text-transform: capitalize behavior).
 * If the string is in all uppercase, converts to lowercase first before capitalizing word boundaries.
 */
export function capitalizeWords(text: string | null | undefined): string {
  if (!text) return '';
  const str = String(text).trim();
  if (!str) return '';

  // If text is all uppercase (e.g. "BLACK WALLET"), convert to lowercase first so words become "Black Wallet"
  const isAllUpper = str === str.toUpperCase() && /[A-Z]/.test(str);
  const normalized = isAllUpper ? str.toLowerCase() : str;

  // Capitalize first character of each word, preserving other casing
  return normalized.replace(/\b([a-z])/g, (_, char) => char.toUpperCase());
}
