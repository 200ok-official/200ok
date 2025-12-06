'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isBefore, startOfDay } from 'date-fns';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = '選擇日期',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true;
    return false;
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="relative" ref={containerRef}>
      {/* 輸入框 */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-lg border ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-300'
            : 'border-[#c5ae8c] cursor-pointer hover:border-[#20263e] focus-within:border-[#20263e] focus-within:ring-2 focus-within:ring-[#20263e] focus-within:ring-opacity-20'
        } transition-all flex items-center justify-between`}
      >
        <span className={value ? 'text-[#20263e]' : 'text-gray-400'}>
          {value ? format(value, 'yyyy/MM/dd') : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          )}
          <svg
            className={`w-5 h-5 text-[#c5ae8c] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </div>

      {/* 行事曆下拉選單 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-[#c5ae8c] p-4 w-80">
          {/* 月份導航 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#20263e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-[#20263e]">
              {format(currentMonth, 'yyyy 年 MM 月')}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#20263e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-[#c5ae8c] py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = value && isSameDay(day, value);
              const isTodayDate = isToday(day);
              const disabled = isDateDisabled(day);

              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isSelected
                      ? 'bg-[#20263e] text-white font-semibold'
                      : isTodayDate
                      ? 'bg-[#e6dfcf] text-[#20263e] font-semibold border-2 border-[#c5ae8c]'
                      : isCurrentMonth && !disabled
                      ? 'hover:bg-[#f5f3ed] text-[#20263e]'
                      : ''
                    }
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* 快捷操作 */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  handleDateSelect(today);
                }
              }}
              className="flex-1 px-3 py-2 text-sm bg-[#e6dfcf] text-[#20263e] rounded-lg hover:bg-[#d4be9c] transition-colors"
              disabled={isDateDisabled(new Date())}
            >
              今天
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                清除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

