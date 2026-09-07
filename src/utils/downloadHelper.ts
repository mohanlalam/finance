/**
 * Browser DOM file download helper utility.
 * Decouples DOM manipulation from pure financial export serialization.
 */
export function downloadFile(content: string, filename: string, mime: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
