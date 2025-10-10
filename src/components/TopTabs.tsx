'use client';

// import { useState } from 'react';

interface TopTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'foryou', label: 'For you', description: '为你推荐' },
  { id: 'following', label: 'Following', description: '关注中' },
  { id: 'trending', label: 'Trending', description: '趋势' },
];

export function TopTabs({ activeTab, onTabChange }: TopTabsProps) {
  return (
    <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-30">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50'
            }`}
          >
            <div className="text-base">{tab.label}</div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
