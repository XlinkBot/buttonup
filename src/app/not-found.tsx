import Link from 'next/link';
import { Home, Search, Archive } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-black transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/search"
              className="inline-flex items-center justify-center bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Link>
            <Link
              href="/archive"
              className="inline-flex items-center justify-center bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}