import React from 'react';
import { ScheduleWithDetails } from '../../shared/types';
import { formatTimeRange, formatTimeTo12Hour } from '../../utils/timeFormat';

interface WeeklyCalendarProps {
  schedules: ScheduleWithDetails[];
  onScheduleClick?: (schedule: ScheduleWithDetails) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-red-100 border-red-300 text-red-800',
];

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ schedules, onScheduleClick }) => {
  // Convert time string to minutes for positioning
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get position and height for a schedule block
  const getScheduleStyle = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    
    // Calculate position from 8:00 AM (480 minutes)
    const startOffset = startMinutes - 480;
    const topPercent = (startOffset / 30) * 4; // Each 30-min slot is 4% height
    const heightPercent = (duration / 30) * 4;

    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  // Get color based on course
  const getCourseColor = (courseId: number): string => {
    return COLORS[courseId % COLORS.length];
  };

  // Group schedules by day
  const schedulesByDay = DAYS.reduce((acc, day) => {
    acc[day] = schedules.filter(s => s.day === day);
    return acc;
  }, {} as Record<string, ScheduleWithDetails[]>);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 border-r bg-gray-50 font-semibold text-sm">Time</div>
        {DAYS.map(day => (
          <div key={day} className="p-2 border-r last:border-r-0 bg-gray-50 font-semibold text-sm text-center">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-8 relative" style={{ height: '800px' }}>
        {/* Time column */}
        <div className="border-r">
          {TIME_SLOTS.map((time, idx) => (
            <div 
              key={time} 
              className="border-b text-xs text-gray-500 p-1 text-right pr-2"
              style={{ height: '38px' }}
            >
              {idx % 2 === 0 ? formatTimeTo12Hour(time) : ''}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map(day => (
          <div key={day} className="border-r last:border-r-0 relative">
            {/* Grid lines */}
            {TIME_SLOTS.map(time => (
              <div 
                key={time} 
                className="border-b"
                style={{ height: '38px' }}
              />
            ))}

            {/* Schedule blocks */}
            <div className="absolute inset-0">
              {schedulesByDay[day]?.map((schedule) => {
                const style = getScheduleStyle(schedule.start_time, schedule.end_time);
                const colorClass = getCourseColor(schedule.course_id);
                
                return (
                  <div
                    key={schedule.id}
                    className={`absolute left-0 right-0 mx-1 border-l-4 rounded px-1 py-1 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden ${colorClass}`}
                    style={style}
                    onClick={() => onScheduleClick?.(schedule)}
                    title={`${schedule.course_code || 'N/A'} - ${schedule.instructor_name || 'N/A'}\n${schedule.room_name || 'N/A'} - Section ${schedule.section_name || 'N/A'}\n${formatTimeRange(schedule.start_time, schedule.end_time)}`}
                  >
                    <div className="text-xs font-semibold truncate">{schedule.course_code}</div>
                    <div className="text-xs truncate">{schedule.instructor_name}</div>
                    <div className="text-xs truncate">{schedule.room_name}</div>
                    <div className="text-xs truncate">Sec {schedule.section_name}</div>
                    <div className="text-xs font-mono">{formatTimeRange(schedule.start_time, schedule.end_time)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
