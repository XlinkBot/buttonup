'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`当前主题: ${currentTheme.label}`}
      >
        <CurrentIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;
              
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isSelected 
                      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {themeOption.label}
                  {themeOption.value === 'system' && (
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      ({actualTheme === 'dark' ? '深色' : '浅色'})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
