import { Fragment, type ReactNode } from "react";

const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/**
 * Paragraph text may contain Markdown-style links, `[label](https://…)`, so a
 * link can sit inside a sentence without the content model needing markup.
 */
export function RichText({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(text.slice(last, index));
    }
    parts.push(
      <a key={`${href}-${index}`} href={href}>
        {label}
      </a>,
    );
    last = index + whole.length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}

/** Every link target used inside a piece of rich text. */
export function extractLinks(text: string): string[] {
  return [...text.matchAll(LINK)].map((match) => match[2]);
}

/** The text with link markup removed, as a reader would hear it. */
export function plainText(text: string): string {
  return text.replace(LINK, "$1");
}
