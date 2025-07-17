'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Video, Play, Download, Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SavedPost {
  id: string;
  title: string;
  text: string;
  subreddit: string;
  score: number;
  created_at: string;
}

interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}

export default function GeneratePage() {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [title, setTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [backgroundType, setBackgroundType] = useState('');
  const [backgroundCategories, setBackgroundCategories] = useState<string[]>([]);
  const [voiceType, setVoiceType] = useState('female');
  const voiceOptions = [
    { value: 'female', label: 'Female (Aria)' },
    { value: 'jenny', label: 'Female (Jenny)' },
    { value: 'male', label: 'Male (Guy)' },
    { value: 'davis', label: 'Male (Davis)' }
  ];
  const [job, setJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedPosts();
    fetchBackgroundCategories();
  }, []);

  const fetchBackgroundCategories = async () => {
    try {
      const response = await fetch('/api/backgrounds/categories');
      const data = await response.json();
      if (response.ok) {
        setBackgroundCategories(data);
        if (data.length > 0) {
          setBackgroundType(data[0]); // Set default to the first category
        }
      } else {
        console.error('Failed to fetch background categories');
      }
    } catch (error) {
      console.error('Error fetching background categories:', error);
      toast.error('Could not load background video categories.');
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      
      if (response.ok) {
        setSavedPosts(data.posts);
      } else {
        console.error('Failed to fetch saved posts');
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const textToUse = useCustomText ? customText : selectedText;
    if (!textToUse.trim() || !title.trim()) {
      toast.error('Please provide a title and text.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/video/generate-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          text: textToUse,
          backgroundType,
          voiceType,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setJob(data);
        toast.success('Video generation started!');
        pollJobStatus(data.id);
      } else {
        throw new Error(data.error || 'Failed to start video generation');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/job/${jobId}`);
        const data = await response.json();
        
        setJob(data);
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          if (data.status === 'completed') {
            toast.success('Video generated successfully!');
          } else {
            toast.error(`Video generation failed: ${data.error}`);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);
  };

  const handlePreviewVoice = async () => {
    try {
      const response = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceType })
      });
      if (!response.ok) throw new Error('Preview failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error('Voice preview error:', err);
      toast.error('Failed to preview voice');
    }
  };

  const handlePostSelect = (post: SavedPost) => {
    setTitle(post.title);
    setSelectedText(post.text);
    setUseCustomText(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Video Generator
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Create TikTok-style videos with background footage and captions
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              href="/"
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link 
              href="/scrape"
              className="btn-primary flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Scrape More Posts
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Text Selection */}
          <div className="card-elevated p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Content</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setUseCustomText(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !useCustomText 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Saved Posts
                </button>
                <button
                  onClick={() => setUseCustomText(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    useCustomText 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom Text
                </button>
              </div>

              {useCustomText ? (
                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for your video"
                    className="form-input w-full px-4 py-3 mb-4"
                  />
                  <label className="block text-gray-900 font-medium mb-2">
                    Custom Text
                  </label>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Enter your custom text here..."
                    className="form-input w-full h-40 px-4 py-3 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Saved Posts ({savedPosts.length})
                  </label>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {savedPosts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No saved posts found.</p>
                        <Link 
                          href="/scrape"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Scrape some posts first
                        </Link>
                      </div>
                    ) : (
                      savedPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => handlePostSelect(post)}
                          className={`bg-gray-50 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-100 border ${
                            title === post.title ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
                          }`}
                        >
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                            {post.text}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>r/{post.subreddit}</span>
                            <span>Score: {post.score}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Selected/Custom Text Preview */}
              {(selectedText || customText) && (
                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Text to be used in video:
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto border border-gray-200">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {useCustomText ? customText : selectedText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Video Settings */}
          <div className="card-elevated p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Video Settings</h2>
            
            <form onSubmit={handleGenerate} className="space-y-6">

                {/* Background Type */}
                <div>
                  <label className="block text-gray-900 font-medium mb-2">
                    Background Video
                  </label>
                  <select
                    value={backgroundType}
                    onChange={(e) => setBackgroundType(e.target.value)}
                    className="form-input w-full px-4 py-3"
                    disabled={backgroundCategories.length === 0}
                  >
                    {backgroundCategories.length > 0 ? (
                      backgroundCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        No background categories found in downloads folder
                      </option>
                    )}
                  </select>
                </div>

                {/* Voice Type */}
                <div>
                  <label className="block text-gray-900 font-medium mb-2">Voice</label>
                  <div className="flex gap-2">
                    <select
                      value={voiceType}
                      onChange={(e) => setVoiceType(e.target.value)}
                      className="form-input flex-1 px-4 py-3"
                    >
                      {voiceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handlePreviewVoice}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                type="submit"
                disabled={loading || (!selectedText && !customText)}
                className="w-full btn-primary py-4 px-6 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    Generate Video
                  </>
                )}
              </button>
            </form>

            {/* Progress Display */}
            {job && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-soft">
                <h3 className="text-gray-900 font-bold mb-4">Video Generation Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      job.status === 'completed' ? 'text-green-600' :
                      job.status === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-center text-gray-600">
                    {job.progress}% complete
                  </div>

                  {job.status === 'completed' && job.videoUrl && (
                    <a
                      href={job.videoUrl}
                      download
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </a>
                  )}

                  {job.status === 'failed' && job.error && (
                    <div className="text-red-600 text-center">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 