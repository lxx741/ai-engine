/**
 * 通用工具函数
 */

/**
 * Sleep for a given number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a string is a valid JSON
 * @param str String to check
 * @returns true if valid JSON, false otherwise
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate token count (rough estimate)
 * @param text Text to count tokens
 * @returns Estimated token count (1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
