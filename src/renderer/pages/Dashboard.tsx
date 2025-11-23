import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course, Instructor, Room, Section, ScheduleWithDetails } from '../../shared/types';
import { formatTimeRange } from '../../utils/timeFormat';

interface DashboardStats {
  totalCourses: number;
  totalInstructors: number;
  totalRooms: number;
  totalSections: number;
  totalSchedules: number;
  todaySchedules: ScheduleWithDetails[];
  recentSchedules: ScheduleWithDetails[];
  totalConflicts: number;
  schedulesByDay: Record<string, number>;
  instructorLoad: Array<{ name: string; count: number }>;
  roomUtilization: Array<{ name: string; usage: number }>;
  coursePopularity: Array<{ code: string; title: string; count: number }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalInstructors: 0,
    totalRooms: 0,
    totalSections: 0,
    totalSchedules: 0,
    todaySchedules: [],
    recentSchedules: [],
    totalConflicts: 0,
    schedulesByDay: {},
    instructorLoad: [],
    roomUtilization: [],
    coursePopularity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [coursesRes, instructorsRes, roomsRes, sectionsRes, schedulesRes] = await Promise.all([
        window.electron.course.getAll(),
        window.electron.instructor.getAll(),
        window.electron.room.getAll(),
        window.electron.section.getAll(),
        window.electron.schedule.getAll(),
      ]);

      const courses: Course[] = coursesRes.success ? coursesRes.data || [] : [];
      const instructors: Instructor[] = instructorsRes.success ? instructorsRes.data || [] : [];
      const rooms: Room[] = roomsRes.success ? roomsRes.data || [] : [];
      const sections: Section[] = sectionsRes.success ? sectionsRes.data || [] : [];
      const schedules: ScheduleWithDetails[] = schedulesRes.success ? schedulesRes.data || [] : [];

      // Get today's day name
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedules = schedules.filter(s => s.day === today);

      // Group schedules by unique combination (course, section, instructor, room, time)
      // to get the count of unique schedule groups instead of individual day records
      const scheduleGroups = new Map<string, ScheduleWithDetails[]>();
      schedules.forEach(schedule => {
        const key = `${schedule.course_id}-${schedule.section_id}-${schedule.instructor_id}-${schedule.room_id}-${schedule.start_time}-${schedule.end_time}`;
        if (!scheduleGroups.has(key)) {
          scheduleGroups.set(key, []);
        }
        scheduleGroups.get(key)!.push(schedule);
      });

      // Calculate schedules by day
      const schedulesByDay: Record<string, number> = {};
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
        schedulesByDay[day] = schedules.filter(s => s.day === day).length;
      });

      // Calculate instructor load (top 5 only for production scale)
      const instructorLoadMap = new Map<string, number>();
      schedules.forEach(schedule => {
        const name = schedule.instructor_name || 'Unknown';
        instructorLoadMap.set(name, (instructorLoadMap.get(name) || 0) + 1);
      });
      const instructorLoad = Array.from(instructorLoadMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate room utilization (top 5 only for production scale)
      const roomUtilizationMap = new Map<string, number>();
      schedules.forEach(schedule => {
        const name = schedule.room_name || 'Unknown';
        roomUtilizationMap.set(name, (roomUtilizationMap.get(name) || 0) + 1);
      });
      const roomUtilization = Array.from(roomUtilizationMap.entries())
        .map(([name, usage]) => ({ name, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5);

      // Calculate section distribution (courses with most unique sections)
      const sectionDistributionMap = new Map<number, { code: string; title: string; sections: Set<number> }>();
      schedules.forEach(schedule => {
        if (!sectionDistributionMap.has(schedule.course_id)) {
          sectionDistributionMap.set(schedule.course_id, {
            code: schedule.course_code || 'Unknown',
            title: schedule.course_title || 'Unknown',
            sections: new Set(),
          });
        }
        const course = sectionDistributionMap.get(schedule.course_id)!;
        course.sections.add(schedule.section_id);
      });
      const coursePopularity = Array.from(sectionDistributionMap.values())
        .map(course => ({
          code: course.code,
          title: course.title,
          count: course.sections.size,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 only for production scale

      // Count total unique conflicts
      const conflictSet = new Set<number>();
      for (const schedule of schedules) {
        try {
          const response = await window.electron.schedule.detectConflicts({
            course_id: schedule.course_id,
            instructor_id: schedule.instructor_id,
            room_id: schedule.room_id,
            section_id: schedule.section_id,
            day: schedule.day,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            available_space: schedule.available_space || 0,
            notes: schedule.notes || '',
          }, [schedule.id]);
          if (response.success && response.data && response.data.length > 0) {
            // Mark this schedule as having a conflict
            conflictSet.add(schedule.id);
          }
        } catch (err) {
          console.error('Error detecting conflicts for schedule:', schedule.id);
        }
      }
      const totalConflicts = conflictSet.size;

      setStats({
        totalCourses: courses.length,
        totalInstructors: instructors.length,
        totalRooms: rooms.length,
        totalSections: sections.length,
        totalSchedules: scheduleGroups.size,
        todaySchedules,
        recentSchedules: schedules.slice(0, 5),
        totalConflicts: totalConflicts,
        schedulesByDay,
        instructorLoad,
        roomUtilization,
        coursePopularity,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }: { 
    title: string; 
    value: number; 
    icon: string; 
    color: string;
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 dashboard-content">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon="📚"
          color="text-blue-600"
          onClick={() => navigate('/courses')}
        />
        <StatCard
          title="Total Instructors"
          value={stats.totalInstructors}
          icon="👨‍🏫"
          color="text-green-600"
          onClick={() => navigate('/instructors')}
        />
        <StatCard
          title="Total Rooms"
          value={stats.totalRooms}
          icon="🏫"
          color="text-purple-600"
          onClick={() => navigate('/rooms')}
        />
        <StatCard
          title="Total Sections"
          value={stats.totalSections}
          icon="📋"
          color="text-orange-600"
          onClick={() => navigate('/sections')}
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Schedules"
          value={stats.totalSchedules}
          icon="📅"
          color="text-indigo-600"
          onClick={() => navigate('/schedules')}
        />
        <StatCard
          title="Today's Classes"
          value={stats.todaySchedules.length}
          icon="📖"
          color="text-teal-600"
          onClick={() => navigate('/schedules')}
        />
        <StatCard
          title="Total Conflicts"
          value={stats.totalConflicts}
          icon={stats.totalConflicts > 0 ? "⚠️" : "✅"}
          color={stats.totalConflicts > 0 ? "text-red-600" : "text-green-600"}
          onClick={() => navigate('/schedules')}
        />
      </div>

      {/* Today's Schedule */}
      {stats.todaySchedules.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 print-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Today's Classes ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</h2>
            {stats.todaySchedules.length > 5 && (
              <button
                onClick={() => navigate('/schedules')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium no-print"
              >
                View All ({stats.todaySchedules.length}) →
              </button>
            )}
          </div>
          <div className="space-y-3">
            {stats.todaySchedules.slice(0, 5).map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-semibold">{schedule.course_code} - {schedule.course_title}</div>
                  <div className="text-sm text-gray-600">
                    {schedule.instructor_name} • {schedule.room_name} • Section {schedule.section_name}
                  </div>
                </div>
                <div className="text-sm font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded">
                  {formatTimeRange(schedule.start_time, schedule.end_time)}
                </div>
              </div>
            ))}
          </div>
          {stats.todaySchedules.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/schedules')}
                className="text-sm text-gray-600 hover:text-gray-800 no-print"
              >
                + {stats.todaySchedules.length - 5} more classes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print-section">
        {/* Schedules by Day Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">📊 Schedules by Day</h3>
          <div className="space-y-3">
            {Object.entries(stats.schedulesByDay).map(([day, count]) => (
              <div key={day}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{day}</span>
                  <span className="text-gray-600">{count} classes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((count / Math.max(...Object.values(stats.schedulesByDay))) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructor Load Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">👨‍🏫 Top Instructors by Load</h3>
          <div className="space-y-3">
            {stats.instructorLoad.map((instructor, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{instructor.name}</span>
                  <span className="text-gray-600">{instructor.count} classes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((instructor.count / (stats.instructorLoad[0]?.count || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Utilization Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">🏢 Room Utilization</h3>
          <div className="space-y-3">
            {stats.roomUtilization.map((room, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{room.name}</span>
                  <span className="text-gray-600">{room.usage} bookings</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((room.usage / (stats.roomUtilization[0]?.usage || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">📚 Section Distribution</h3>
          <div className="space-y-3">
            {stats.coursePopularity.map((course, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{course.code}</span>
                  <span className="text-gray-600">{course.count} section{course.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1 truncate">{course.title}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((course.count / (stats.coursePopularity[0]?.count || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflict Alert Box */}
        {stats.totalConflicts > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-md p-6">
            <div className="flex items-start">
              <div className="text-4xl mr-4">⚠️</div>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-2">Conflicts Detected!</h3>
                <p className="text-sm text-red-700 mb-4">
                  There are {stats.totalConflicts} scheduling conflict(s) that need attention.
                </p>
                <button
                  onClick={() => navigate('/schedules')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium no-print"
                >
                  Resolve Conflicts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Schedules */}
      <div className="bg-white rounded-lg shadow-md p-6 print-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Schedules</h2>
          <button
            onClick={() => navigate('/schedules')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentSchedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No schedules found. Create your first schedule to get started.
                  </td>
                </tr>
              ) : (
                stats.recentSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{schedule.course_code}</div>
                      <div className="text-sm text-gray-500">{schedule.course_title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.instructor_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.room_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.day}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTimeRange(schedule.start_time, schedule.end_time)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.section_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
