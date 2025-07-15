'use client';

import Link from 'next/link';
import { Search, Video, Database, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Reddit Story Video Generator
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform Reddit posts into engaging TikTok-style videos with AI narration and dynamic backgrounds
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/scrape"
              className="btn-primary flex items-center gap-3"
            >
              <Search className="w-6 h-6" />
              Start Scraping
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link 
              href="/generate"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md"
            >
              <Video className="w-6 h-6" />
              Generate Video
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Scraping Card */}
          <div className="card-elevated card-hover p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 p-3 rounded-full mr-4 shadow-medium">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Reddit Scraper</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Extract posts from any Reddit URL, clean and format the text, and save to database or export to Excel.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                <span>Scrape multiple posts at once</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Database className="w-5 h-5 mr-2 text-blue-500" />
                <span>Save to database or export to Excel</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                <span>Clean and format text automatically</span>
              </div>
            </div>
            
            <Link 
              href="/scrape"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Start Scraping
            </Link>
          </div>

          {/* Video Generation Card */}
          <div className="card-elevated card-hover p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 p-3 rounded-full mr-4 shadow-medium">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Video Generator</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Create professional TikTok-style videos with AI narration, dynamic backgrounds, and large captions.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                <span>AI text-to-speech narration</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Video className="w-5 h-5 mr-2 text-blue-500" />
                <span>Dynamic background videos</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                <span>Large white captions overlay</span>
              </div>
            </div>
            
            <Link 
              href="/generate"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Video className="w-5 h-5" />
              Generate Video
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="card-elevated p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Scrape Posts</h3>
              <p className="text-gray-600">
                Enter a Reddit URL and scrape multiple posts. Save them to database or export to Excel.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select Content</h3>
              <p className="text-gray-600">
                Choose from saved posts or enter custom text. Select background video and voice type.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Video</h3>
              <p className="text-gray-600">
                AI creates a professional video with narration, background footage, and captions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Built with Next.js, Node.js, and Python • Ready for TikTok and social media</p>
        </div>
      </div>
    </div>
  );
} 