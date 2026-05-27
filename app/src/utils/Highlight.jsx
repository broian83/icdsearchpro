import React from 'react';

export const Highlight = ({ text, searchQuery }) => {
  if (!text) return null;
  if (!searchQuery || typeof searchQuery !== 'string') return <span>{text}</span>;

  // Hapus karakter spesial dari query
  const cleanQuery = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!cleanQuery) return <span>{text}</span>;

  // Pisahkan query menjadi kata-kata (words)
  const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length === 0) return <span>{text}</span>;

  // Buat Regex yang mencocokkan kata apa saja di dalam array words
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  
  // Pisahkan teks berdasarkan regex
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        // Cek apakah part ini cocok dengan salah satu kata pencarian (case-insensitive)
        const isMatch = words.some(word => part.toLowerCase() === word.toLowerCase());
        
        return isMatch ? (
          <mark key={i} className="bg-[#D6E400] text-gray-900 px-0.5 rounded-sm font-medium bg-opacity-70 dark:bg-opacity-90">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
};
