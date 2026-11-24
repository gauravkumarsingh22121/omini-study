import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Robust Math & KaTeX Renderer.
 * Supports inline equations ($...$) and display equations ($$...$$).
 * Falls back cleanly to readable formatted string if LaTeX has any syntax error.
 */
export function MathRenderer({ latex, inline = false, className = '' }) {
  const renderedHtml = useMemo(() => {
    if (!latex) return '';
    try {
      // Clean string from any accidental wrapping delimiters
      const cleanLatex = latex
        .replace(/^\$\$|\$\$$/g, '')
        .replace(/^\$|\$$/g, '')
        .trim();

      return katex.renderToString(cleanLatex, {
        displayMode: !inline,
        throwOnError: false
      });
    } catch (err) {
      console.warn("KaTeX render error:", err);
      return `<span class="font-mono text-xs">${latex}</span>`;
    }
  }, [latex, inline]);

  if (!renderedHtml) return null;

  return (
    <span 
      className={`katex-render inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

/**
 * Text renderer that seamlessly parses inline math ($...$) mixed with regular words.
 */
export function TextWithMath({ text = '', className = '' }) {
  if (!text) return null;

  // Split text by inline math delimiters $...$
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const mathSnippet = part.slice(1, -1);
          return <MathRenderer key={idx} latex={mathSnippet} inline={true} />;
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
