'use client';

import { useState } from 'react';
import { Calendar, Filter, X, Check } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DateFilterProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate?: string, endDate?: string) => void;
  onClear: () => void;
}

interface DateRange {
  label: string;
  startDate: Date;
  endDate: Date;
}

export default function DateFilter({ startDate, endDate, onDateChange, onClear }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 预设的时间范围选项
  const today = new Date();
  const dateRanges: DateRange[] = [
    {
      label: '最近7天',
      startDate: subDays(today, 6), // 包含今天，所以是6天前到今天
      endDate: today
    },
    {
      label: '最近30天',
      startDate: subDays(today, 29), // 包含今天，所以是29天前到今天
      endDate: today
    },
    {
      label: '本月',
      startDate: startOfMonth(today),
      endDate: endOfMonth(today)
    },
    {
      label: '最近3个月',
      startDate: subMonths(today, 3),
      endDate: today
    },
    {
      label: '今年',
      startDate: startOfYear(today),
      endDate: endOfYear(today)
    }
  ];

  const handleRangeSelect = (range: DateRange) => {
    const startDateStr = format(range.startDate, 'yyyy-MM-dd');
    const endDateStr = format(range.endDate, 'yyyy-MM-dd');
    onDateChange(startDateStr, endDateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  const hasActiveFilter = startDate || endDate;

  const formatDisplayDate = (date: string) => {
    try {
      return format(new Date(date), 'MM月dd日', { locale: zhCN });
    } catch {
      return date;
    }
  };

  // 检查当前选择是否匹配某个预设范围
  const getCurrentRangeLabel = () => {
    if (!startDate || !endDate) return null;
    
    for (const range of dateRanges) {
      const rangeStart = format(range.startDate, 'yyyy-MM-dd');
      const rangeEnd = format(range.endDate, 'yyyy-MM-dd');
      if (startDate === rangeStart && endDate === rangeEnd) {
        return range.label;
      }
    }
    return null;
  };

  const currentRangeLabel = getCurrentRangeLabel();

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg border transition-colors text-sm ${
          hasActiveFilter
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-600 text-orange-700 dark:text-orange-400'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <Filter className="w-4 h-4 mr-1.5 sm:mr-2" />
        <span className="font-medium">
          {currentRangeLabel || (hasActiveFilter ? '已筛选' : '时间筛选')}
        </span>
        {hasActiveFilter && (
          <span className="ml-1.5 sm:ml-2 w-2 h-2 bg-orange-500 rounded-full"></span>
        )}
      </button>

      {/* Active Filter Display - Mobile Friendly */}
      {hasActiveFilter && !currentRangeLabel && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
            {startDate && formatDisplayDate(startDate)} - {endDate && formatDisplayDate(endDate)}
            <button
              onClick={handleClear}
              className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel - Mobile Optimized */}
          <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-3 sm:p-4">
              <div className="flex items-center mb-3 sm:mb-4">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  选择时间范围
                </h3>
              </div>

              {/* Preset Ranges */}
              <div className="space-y-1">
                {dateRanges.map((range, index) => {
                  const rangeStart = format(range.startDate, 'yyyy-MM-dd');
                  const rangeEnd = format(range.endDate, 'yyyy-MM-dd');
                  const isSelected = startDate === rangeStart && endDate === rangeEnd;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleRangeSelect(range)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-600'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{range.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(range.startDate, 'MM/dd', { locale: zhCN })} - {format(range.endDate, 'MM/dd', { locale: zhCN })}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  清除筛选
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
