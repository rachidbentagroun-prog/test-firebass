
import React from 'react';
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import { Article } from '../types';

interface BlogSectionProps {
  articles: Article[];
}

export const BlogSection: React.FC<BlogSectionProps> = ({ articles }) => {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="py-24 bg-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Latest News & Tutorials</h2>
            <p className="text-gray-400">Tips, tricks, and updates from the ImaginAI team.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="group bg-dark-900 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all">
              {article.imageUrl ? (
                <div className="h-48 overflow-hidden">
                   <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                    <span className="text-indigo-300 font-bold opacity-30 text-4xl">News</span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  {article.date}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                
                {article.link && (
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300">
                    Read More <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
