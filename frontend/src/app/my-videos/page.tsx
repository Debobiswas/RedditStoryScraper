'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Home, Video, Bot, PlusSquare } from 'lucide-react';

interface Video {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

const MyVideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      toast.error('Could not load videos. Please try again later.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">My Generated Videos</h1>
          <p className="text-lg text-gray-600">Here are all the videos you've created.</p>
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/" className="btn-secondary flex items-center gap-2">
              <Home size={18} /> Home
            </Link>
            <Link href="/generate" className="btn-primary flex items-center gap-2">
              <PlusSquare size={18} /> Generate New Video
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center card-elevated p-8">
            <Video size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">No Videos Found</h2>
            <p className="text-gray-600">You haven't generated any videos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <div key={video.filename} className="card-elevated overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="p-6">
                  <h2 className="text-xl font-semibold truncate mb-4 text-gray-900" title={video.filename}>
                    {video.filename}
                  </h2>
                  <video controls preload="metadata" className="w-full rounded-md mb-4 aspect-video">
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Created: {new Date(video.createdAt).toLocaleString()}</p>
                    <p>Size: {formatBytes(video.size)}</p>
                  </div>
                  <a
                    href={video.url}
                    download={video.filename}
                    className="w-full text-center btn-primary block"
                  >
                    Download Video
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVideosPage; 