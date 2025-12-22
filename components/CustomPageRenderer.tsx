
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CustomPage } from '../types';

interface CustomPageRendererProps {
  page: CustomPage;
  onBack: () => void;
}

export const CustomPageRenderer: React.FC<CustomPageRendererProps> = ({ page, onBack }) => {
  // Simple markdown-like parser for the content
  const renderContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Headings
      if (line.startsWith('# ')) return <h1 key={idx} className="text-4xl font-bold text-white mt-12 mb-6">{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-semibold text-white mt-8 mb-4 border-b border-white/10 pb-2">{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-semibold text-indigo-400 mt-6 mb-3">{line.substring(4)}</h3>;
      
      // List items
      if (line.trim().startsWith('- ')) return <li key={idx} className="ml-6 list-disc text-gray-300 mb-2 pl-2">{line.trim().substring(2)}</li>;
      
      // Blockquotes
      if (line.trim().startsWith('> ')) return <blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 italic text-gray-400 my-4 py-1 bg-white/5 rounded-r">{line.trim().substring(2)}</blockquote>;

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') return <hr key={idx} className="border-white/10 my-8" />;

      // Empty lines
      if (line.trim() === '') return <div key={idx} className="h-4" />;
      
      // Code blocks (simple single line)
      if (line.startsWith('`') && line.endsWith('`')) {
          return <div key={idx} className="bg-black/30 p-4 rounded-lg border border-white/10 font-mono text-sm text-gray-300 my-4">{line.substring(1, line.length-1)}</div>
      }

      // Standard Paragraphs with bold/italic parsing (very basic)
      // Note: A real app should use 'react-markdown' or similar. 
      // This is a lightweight implementation for the requested feature without new deps.
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      
      return (
        <p key={idx} className="mb-4 text-gray-300 leading-relaxed text-lg">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} className="text-gray-200 italic">{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-dark-950 text-white animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Home</span>
        </button>

        <article className="bg-dark-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Render Title only if not included in content as H1 */}
          {!page.content.startsWith('# ') && (
             <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 pb-2">
                {page.title}
             </h1>
          )}
          
          <div className="prose prose-invert prose-lg max-w-none">
            {renderContent(page.content)}
          </div>
        </article>
      </div>
    </div>
  );
};
