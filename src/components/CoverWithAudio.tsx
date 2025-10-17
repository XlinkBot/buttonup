'use client';

import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import OptimizedImage from './OptimizedImage';

interface CoverWithAudioProps {
  title: string;
  cover?: string;
  podcasturl?: string;
  className?: string;
}

export default function CoverWithAudio({ 
  title, 
  cover, 
  podcasturl, 
  className = '' 
}: CoverWithAudioProps) {
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (podcasturl) {
      setAudioError(null); // Clear any previous errors
      setShowAudioPlayer(true);
    }
  };

  const handleClosePlayer = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowAudioPlayer(false);
    setIsPlaying(false);
    setAudioError(null); // Clear errors when closing
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setAudioError(null); // Clear errors on successful play
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (error: string) => {
    setAudioError(error);
    setIsPlaying(false);
    console.error('🎵 Audio playback error:', error);
  };

  // 如果没有封面图片，不渲染任何内容
  if (!cover) {
    return null;
  }


  return (
    <div className={`relative overflow-hidden rounded-none sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group ${className}`}>
      {/* Cover Image */}
      <OptimizedImage
        src={cover}
        alt={title}
        className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
        style={{
          aspectRatio: '16/9',
          objectPosition: 'center'
        }}
        width={1000}
        height={600}
        priority={true} // 内容页的封面图片应该优先加载
        loading="eager" // 优先图片应该立即加载
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
        fetchPriority="high"
      />
      
      {/* Cover overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      
      {/* Play Button Overlay - Only show if podcast URL exists */}
      {podcasturl && !showAudioPlayer && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            onClick={handlePlayButtonClick}
            className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group/play"
            aria-label={`播放 ${title} 的音频`}
          >
            <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1 group-hover/play:scale-110 transition-transform duration-200" />
          </button>
          
          {/* Play Button Label */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              🎧 点击播放音频版本
            </div>
          </div>
        </div>
      )}

      {/* Audio Player Overlay */}
      {podcasturl && showAudioPlayer && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClosePlayer}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-10"
            aria-label="关闭音频播放器"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Audio Player */}
          <div 
            className="w-full max-w-md"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {audioError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                <div className="text-red-600 dark:text-red-400 text-sm mb-3">
                  🎵 音频加载失败
                </div>
                <p className="text-red-500 dark:text-red-300 text-xs mb-3">
                  {audioError}
                </p>
                <button
                  onClick={() => {
                    setAudioError(null);
                    // Retry by re-rendering the AudioPlayer
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  重试
                </button>
              </div>
            ) : (
              <AudioPlayer
                src={podcasturl}
                title={title}
                autoPlay={true}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleAudioError}
                className="shadow-2xl"
              />
            )}
          </div>
        </div>
      )}

      {/* Audio Status Indicator */}
      {podcasturl && showAudioPlayer && isPlaying && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <div className="flex items-center space-x-2 bg-green-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>正在播放</span>
          </div>
        </div>
      )}
    </div>
  );
}
