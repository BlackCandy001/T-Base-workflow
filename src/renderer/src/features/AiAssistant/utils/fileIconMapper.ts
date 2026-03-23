/**
 * File Extension to Icon Mapper
 * Refactored to use Lucide icons instead of vscode-icons-js
 */

/**
 * Get lucide icon name for a given file
 * @param filename - The filename
 * @returns Lucide icon name or type
 */
export function getFileIconName(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return "file-code";
    case "json":
      return "file-json";
    case "md":
      return "file-text";
    case "css":
    case "scss":
    case "less":
      return "file-style";
    case "html":
      return "file-html";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return "file-image";
    case "pdf":
      return "file-pdf";
    default:
      return "file";
  }
}

/**
 * Get folder icon name
 * @param isOpen - Whether folder is open
 * @returns Lucide icon name
 */
export function getFolderIconName(isOpen: boolean = false): string {
  return isOpen ? "folder-open" : "folder";
}

/**
 * Get provider icon placeholder name
 * @param provider - The provider name
 * @returns A generic name or specific provider if supported by lucide or similar
 */
export function getProviderIconName(provider: string): string {
  const normalized = provider.toLowerCase();

  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return "bot";
  } else if (normalized.includes("gemini") || normalized.includes("google")) {
    return "sparkles";
  } else if (normalized.includes("openai") || normalized.includes("gpt")) {
    return "zap";
  }
  return "bot";
}
