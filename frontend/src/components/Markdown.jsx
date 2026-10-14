import { Fragment } from 'react';

/** Small, safe Markdown renderer (no HTML injection): code fences, lists, bold, inline code, paragraphs. */
function inline(text, keyBase) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    parts.push(tok.startsWith('**')
      ? <strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>
      : <code key={`${keyBase}-${i++}`}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ text = '' }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(<pre key={blocks.length} data-lang={lang || undefined}><code>{code.join('\n')}</code></pre>);
    } else if (/^\s*([-*•])\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*([-*•])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*•])\s+/, ''));
      blocks.push(<ul key={blocks.length}>{items.map((t, k) => <li key={k}>{inline(t, k)}</li>)}</ul>);
    } else if (/^#{1,3}\s/.test(line)) {
      blocks.push(<h4 key={blocks.length}>{inline(line.replace(/^#+\s/, ''), 'h')}</h4>);
      i++;
    } else if (line.trim() === '') {
      i++;
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^\s*([-*•])\s+/.test(lines[i]) && !lines[i].trim().startsWith('```')) para.push(lines[i++]);
      blocks.push(<p key={blocks.length}>{para.map((p, k) => <Fragment key={k}>{k > 0 && <br />}{inline(p, k)}</Fragment>)}</p>);
    }
  }
  return <div className="md">{blocks}</div>;
}
