'use client';

export function ScrollToTopButton() {
  return (
    <button 
      className="fixed bottom-8 right-8 w-12 h-12 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white rounded-full shadow-lg hover:shadow-[#FF7A00]/25 hover:shadow-2xl transition-all duration-300 flex items-center justify-center group z-50"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

export function ShareButtons() {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareToX = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="flex items-center space-x-4">
      <button 
        onClick={copyToClipboard}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-[#FF7A00] text-gray-700 dark:text-[#E3E3E3] hover:text-white rounded-lg transition-colors border border-gray-300 dark:border-gray-600 hover:border-[#FF7A00]"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
        </svg>
        <span className="text-sm">复制链接</span>
      </button>
      <button 
        onClick={shareToX}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-[#1DA1F2] text-gray-700 dark:text-[#E3E3E3] hover:text-white rounded-lg transition-colors border border-gray-300 dark:border-gray-600 hover:border-[#1DA1F2]"
      >
        <span className="text-sm">X</span>
      </button>
      <button 
        onClick={shareToLinkedIn}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-[#0077B5] text-gray-700 dark:text-[#E3E3E3] hover:text-white rounded-lg transition-colors border border-gray-300 dark:border-gray-600 hover:border-[#0077B5]"
      >
        <span className="text-sm">LinkedIn</span>
      </button>
    </div>
  );
}
