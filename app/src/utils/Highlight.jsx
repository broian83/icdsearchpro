import React from 'react';

export const Highlight = ({ text, matches, property }) => {
  if (!matches || matches.length === 0) return <span>{text}</span>;

  const match = matches.find((m) => m.key === property);
  if (!match || !match.indices || match.indices.length === 0) {
    return <span>{text}</span>;
  }

  // Filter out single character matches to avoid messy scattered highlights
  const validIndices = match.indices.filter(([start, end]) => (end - start) > 0);

  if (validIndices.length === 0) {
    return <span>{text}</span>;
  }

  const indices = validIndices;
  let lastIndex = 0;
  const parts = [];

  indices.forEach(([start, end], i) => {
    if (start > lastIndex) {
      parts.push(<span key={`text-${i}`}>{text.substring(lastIndex, start)}</span>);
    }
    parts.push(
      <span key={`mark-${i}`} className="bg-[#D6E400] text-gray-900 px-0.5 rounded-sm font-medium">
        {text.substring(start, end + 1)}
      </span>
    );
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    parts.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>);
  }

  return <span>{parts}</span>;
};
