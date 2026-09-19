import type { ReactNode } from 'react';

/**
 * A 60-line markdown subset: paragraphs, `-` bullets, `>` callouts, `**bold**`
 * and `*italic*`. Deliberately not a library — the sample stays dependency-free
 * and you can see exactly what the agent is allowed to emit.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      out.push(<strong key={`${keyBase}-b${i++}`}>{token.slice(2, -2)}</strong>);
    } else {
      out.push(<em key={`${keyBase}-i${i++}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
    } else if (line.startsWith('## ')) {
      blocks.push(<h3 key={key++}>{inline(line.slice(3), `h${key}`)}</h3>);
      i++;
    } else if (line.startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) quote.push(lines[i++].slice(2));
      blocks.push(
        <blockquote key={key++} className="callout">
          {inline(quote.join(' '), `q${key}`)}
        </blockquote>,
      );
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2));
      blocks.push(
        <ul key={key++}>
          {items.map((item, n) => (
            <li key={n}>{inline(item, `l${key}-${n}`)}</li>
          ))}
        </ul>,
      );
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(##|>|-) /.test(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={key++}>{inline(para.join(' '), `p${key}`)}</p>);
    }
  }

  return <>{blocks}</>;
}
