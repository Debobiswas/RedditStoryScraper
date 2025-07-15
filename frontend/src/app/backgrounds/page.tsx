'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BackgroundManagerPage = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [backgroundVideos, setBackgroundVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Tracks which video is being deleted

  const fetchBackgrounds = async () => {
    try {
      const response = await fetch('/api/backgrounds');
      if (!response.ok) {
        throw new Error('Failed to fetch background videos');
      }
      const data = await response.json();
      setBackgroundVideos(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/backgrounds/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      } else {
        setSelectedCategory('new');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchBackgrounds();
    fetchCategories();
  }, []);

  const handleDownload = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL.');
      return;
    }

    const categoryToUse = selectedCategory === 'new' ? newCategory.trim() : selectedCategory;
    if (!categoryToUse) {
      toast.error('Please select or create a category.');
      return;
    }

    setIsDownloading(true);
    toast.loading('Starting download...');

    try {
      const response = await fetch('/api/backgrounds/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl, category: categoryToUse }),
      });

      const data = await response.json();
      toast.dismiss();

      if (!response.ok) {
        throw new Error(data.details || 'Failed to start download.');
      }

      toast.success('Download finished successfully!');
      setYoutubeUrl('');
      fetchBackgrounds(); // Refresh the list
    } catch (error) {
      toast.dismiss();
      toast.error(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    setIsDeleting(filename);
    toast.loading(`Deleting ${filename}...`);

    try {
      const response = await fetch(`/api/backgrounds/${filename}`, { method: 'DELETE' });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok) throw new Error(data.error || 'Failed to delete video.');
      toast.success(`Deleted ${filename} successfully!`);
      fetchBackgrounds(); // Refresh the list
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to delete: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Background Video Manager
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Download new background videos from YouTube and manage your library.
          </p>
        </header>

        {/* Download Section */}
        <section className="card-elevated p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Download New Video</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="form-input w-full p-3"
              disabled={isDownloading}
            />
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input flex-grow p-3"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="new">+ Create New Category</option>
              </select>
              {selectedCategory === 'new' && (
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name..."
                  className="form-input flex-grow p-3"
                />
              )}
              <button
                onClick={handleDownload}
                className="btn-primary transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isDownloading || isDeleting}
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </section>

        {/* Video Gallery Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Video Library</h2>
          {backgroundVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {backgroundVideos.map((videoName) => (
                <div key={videoName} className="card-elevated overflow-hidden flex flex-col">
                  <div className="w-full h-48 bg-black">
                    <video
                      src={`/backgrounds/${encodeURIComponent(videoName)}`}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                      controls
                    />
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <p className="text-gray-700 text-sm break-all" title={videoName}>{videoName}</p>
                    <button
                      onClick={() => handleDelete(videoName)}
                      className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 shadow-soft hover:shadow-medium"
                      disabled={isDeleting === videoName}
                    >
                      {isDeleting === videoName ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card-elevated">
              <p className="text-gray-600">Your video library is empty.</p>
              <p className="text-gray-500 text-sm mt-2">Download videos using the form above.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BackgroundManagerPage; 