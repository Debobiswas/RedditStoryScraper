import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reddit Story Video Generator',
  description: 'Turn Reddit posts into engaging narrated videos with background footage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-blue-50 to-white min-h-screen`}>
        <header className="bg-white header-shadow border-b border-gray-200">
          <nav className="container mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              {/* Logo Section */}
              <div className="flex items-center justify-center lg:justify-start">
                <Link href="/" className="group flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Reddit Story Generator
                    </h1>
                    <p className="text-sm text-gray-500 hidden sm:block">Create engaging videos from Reddit posts</p>
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap justify-center lg:justify-end gap-3">
                <Link 
                  href="/scrape" 
                  className="px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all duration-200 text-sm font-medium"
                >
                  📥 Scrape Posts
                </Link>
                <Link 
                  href="/generate" 
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
                >
                  🎬 Generate Video
                </Link>
                <Link 
                  href="/my-videos" 
                  className="px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all duration-200 text-sm font-medium"
                >
                  📹 My Videos
                </Link>
                <Link
                  href="/backgrounds"
                  className="px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all duration-200 text-sm font-medium"
                >
                  🎨 Backgrounds
                </Link>
                <Link
                  href="/story-ai"
                  className="px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all duration-200 text-sm font-medium"
                >
                  💬 AI Chat
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
} 