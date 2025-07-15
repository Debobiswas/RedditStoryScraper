'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Download, Database, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface RedditPost {
  id: string;
  title: string;
  text: string;
  url: string;
  score: number;
  subreddit: string;
  created_utc: number;
}

export default function ScrapePage() {
  const [redditUrl, setRedditUrl] = useState('');
  const [numPosts, setNumPosts] = useState(10);
  const [sortBy, setSortBy] = useState('hot');
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [modalPost, setModalPost] = useState<RedditPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redditUrl,
          numPosts,
          sortBy,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPosts(data.posts);
        toast.success(`Scraped ${data.posts.length} posts successfully!`);
      } else {
        throw new Error(data.error || 'Failed to scrape posts');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromPost = async (post: RedditPost) => {
    setIsGenerating(true);
    toast.loading('Starting video generation...', { id: 'generation-toast' });

    try {
      const response = await fetch('/api/video/generate-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          text: post.text,
          backgroundType: 'minecraft', // Or make this selectable
          voiceType: 'en-US-JennyNeural' // Or make this selectable
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Video generation started! Job ID: ${data.id}`, { id: 'generation-toast' });
        setModalPost(null); // Close modal on success
      } else {
        throw new Error(data.error || 'Failed to start generation');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: 'generation-toast' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (posts.length === 0) {
      toast.error('No posts to save');
      return;
    }

    try {
      const response = await fetch('/api/posts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Posts saved to database successfully!');
      } else {
        throw new Error(data.error || 'Failed to save posts');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleExportToExcel = async () => {
    if (posts.length === 0) {
      toast.error('No posts to export');
      return;
    }

    try {
      const response = await fetch('/api/posts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reddit_posts_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Posts exported to Excel successfully!');
      } else {
        throw new Error('Failed to export posts');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handlePostClick = (post: RedditPost) => {
    const selection = window.getSelection();
    // If user is not selecting text, open modal.
    if (!selection || selection.toString().length === 0) {
      setModalPost(post);
    }
  };

  const clearPosts = () => {
    setPosts([]);
    setSelectedPosts(new Set());
    toast.success('Posts cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Reddit Scraper
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Scrape Reddit posts and save them to database
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              href="/"
              className="btn-secondary"
            >
              ← Back to Home
            </Link>
            <Link 
              href="/generate"
              className="btn-primary"
            >
              Generate Video →
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Scraping Form */}
          <div className="card-elevated p-8 mb-8">
            <form onSubmit={handleScrape} className="space-y-6">
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Reddit URL
                </label>
                                  <input
                    type="url"
                    value={redditUrl}
                    onChange={(e) => setRedditUrl(e.target.value)}
                    placeholder="https://www.reddit.com/r/AmItheAsshole/"
                    className="form-input w-full px-4 py-3"
                    required
                  />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-gray-900 font-medium mb-2">
                    Number of Posts
                  </label>
                  <input
                    type="number"
                    value={numPosts}
                    onChange={(e) => setNumPosts(Number(e.target.value))}
                    min="1"
                    max="50"
                    className="form-input w-full px-4 py-3"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-900 font-medium mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-input w-full px-4 py-3"
                  >
                    <option value="hot">Hot</option>
                    <option value="new">New</option>
                    <option value="top">Top (Today)</option>
                    <option value="rising">Rising</option>
                    <option value="controversial">Controversial (Today)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !redditUrl}
                className="w-full btn-primary py-4 px-6 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Scraping...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Scrape Posts
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Action Buttons */}
          {posts.length > 0 && (
            <div className="card-elevated p-6 mb-8">
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleSaveToDatabase}
                  className="btn-primary flex items-center gap-2"
                >
                  <Database className="w-5 h-5" />
                  Save to Database
                </button>
                
                <button
                  onClick={handleExportToExcel}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export to Excel
                </button>
                
                <button
                  onClick={clearPosts}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear Posts
                </button>
              </div>
            </div>
          )}

          {/* Posts Display */}
          {posts.length > 0 && (
            <div className="card-elevated p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Scraped Posts ({posts.length})
              </h2>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`p-4 rounded-lg transition-colors cursor-pointer border ${
                      selectedPosts.has(post.id)
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                      <span
                        onClick={(e) => {
                          e.stopPropagation(); // prevent modal from opening
                          togglePostSelection(post.id);
                        }}
                        className={`text-sm font-semibold px-2 py-1 rounded-full ml-4 flex-shrink-0 cursor-pointer ${
                          selectedPosts.has(post.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {selectedPosts.has(post.id) ? '✓ Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm truncate">
                      {post.text}
                    </p>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                        <span>r/{post.subreddit}</span>
                        <span>{post.score} upvotes</span>
                        <span>{new Date(post.created_utc * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalPost && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setModalPost(null)}
        >
          <div 
            className="bg-white rounded-2xl modal-shadow w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{modalPost.title}</h2>
              <div className="text-sm text-gray-500 mt-1">
                <span>r/{modalPost.subreddit}</span>
                <span className="mx-2">•</span>
                <span>{modalPost.score} upvotes</span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="whitespace-pre-wrap text-gray-700">{modalPost.text}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <a 
                  href={`https://reddit.com${modalPost.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View on Reddit
                </a>
                <div>
                  <button 
                    onClick={() => setModalPost(null)}
                    className="btn-secondary mr-2"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => handleGenerateFromPost(modalPost)}
                    disabled={isGenerating}
                    className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Video'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 