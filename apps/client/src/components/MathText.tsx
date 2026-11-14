import katex from 'katex';

/**
 * Renders text that may contain inline LaTeX between $ signs.
 * Only KaTeX output is injected as HTML. Everything else is plain text.
 */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/\$([^$]+)\$/);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span
            key={index}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part, { throwOnError: false }),
            }}
          />
        ) : (
          part && <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
