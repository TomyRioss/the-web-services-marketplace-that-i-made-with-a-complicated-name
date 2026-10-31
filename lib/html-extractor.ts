export function extractHtmlFromMarkdown(content: string): string {
  const htmlMatch = content.match(/```html\s*([\s\S]*?)```/);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  const genericMatch = content.match(/```\s*([\s\S]*?)```/);
  if (genericMatch) {
    const code = genericMatch[1].trim();
    if (code.startsWith("<!DOCTYPE") || code.startsWith("<html")) {
      return code;
    }
  }

  if (content.trim().startsWith("<!DOCTYPE") || content.trim().startsWith("<html")) {
    return content.trim();
  }

  return "";
}
