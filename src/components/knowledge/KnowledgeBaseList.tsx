'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { KnowledgeBase } from '@/types';

interface KnowledgeBaseListProps {
  initialEntries?: KnowledgeBase[];
}

export default function KnowledgeBaseList({ initialEntries = [] }: KnowledgeBaseListProps) {
  const [entries, setEntries] = useState<KnowledgeBase[]>(initialEntries);
  const [loading, setLoading] = useState(!initialEntries.length);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!initialEntries.length) {
      fetchEntries();
    }
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/knowledge-base?q=${encodeURIComponent(searchQuery)}`
        : '/api/knowledge-base';
      const response = await fetch(url);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <Link
          href="/dashboard/knowledge-base/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Entry
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Entries Grid */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No knowledge base entries found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                {entry.file_type && (
                  <span className="text-xs text-gray-500 uppercase">{entry.file_type}</span>
                )}
              </div>
              
              {entry.category && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mb-2">
                  {entry.category}
                </span>
              )}

              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {entry.content.substring(0, 150)}...
              </p>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {entry.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                <Link
                  href={`/dashboard/knowledge-base/${entry.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

