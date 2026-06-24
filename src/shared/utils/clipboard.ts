export const LAZY_JSON_PARSE_BYTES = 100_000

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
