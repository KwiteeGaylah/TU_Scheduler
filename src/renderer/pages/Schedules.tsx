import { useState, useEffect, useRef } from 'react';
import type { 
  ScheduleWithDetails, 
  ScheduleCreateInput, 
  Course, 
  Instructor, 
  Room, 
  Section,
  Conflict 
} from '../../shared/types';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { formatTimeRange } from '../../utils/timeFormat';

export default function Schedules() {
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithDetails | null>(null);
  const [formData, setFormData] = useState<ScheduleCreateInput>({
    course_id: 0,
    instructor_id: 0,
    room_id: 0,
    section_id: 0,
    day: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
    available_space: 0,
    notes: '',
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday']);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [filterDay, setFilterDay] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const importDropdownRef = useRef<HTMLDivElement>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [alternativeTimes, setAlternativeTimes] = useState<any[]>([]);
  const [alternativeRooms, setAlternativeRooms] = useState<any[]>([]);
  const [resolutionLoading, setResolutionLoading] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState<Map<number, boolean>>(new Map());

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadSchedules();
    loadDropdownData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
      if (importDropdownRef.current && !importDropdownRef.current.contains(event.target as Node)) {
        setShowImportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.electron.schedule.getAll();
      if (response.success && response.data) {
        setSchedules(response.data);
        // Detect conflicts for all schedules
        await detectAllConflicts(response.data);
      } else {
        setError(response.message || 'Failed to load schedules');
      }
    } catch (err) {
      setError('An error occurred while loading schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOrphaned = async () => {
    if (!confirm('This will remove all schedules for deleted courses, instructors, rooms, or sections. Continue?')) {
      return;
    }

    try {
      const response = await window.electron.schedule.cleanupOrphaned();
      if (response.success) {
        alert(response.message);
        loadSchedules(); // Reload the schedules
      } else {
        alert('Failed to cleanup: ' + response.message);
      }
    } catch (err) {
      alert('Error cleaning up orphaned schedules');
    }
  };

  const detectAllConflicts = async (allSchedules: ScheduleWithDetails[]) => {
    const conflictMap = new Map<number, boolean>();
    
    for (const schedule of allSchedules) {
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
          conflictMap.set(schedule.id, true);
        }
      } catch (err) {
        console.error('Error detecting conflicts for schedule:', schedule.id);
      }
    }
    
    setScheduleConflicts(conflictMap);
  };

  const loadDropdownData = async () => {
    try {
      const [coursesRes, instructorsRes, roomsRes, sectionsRes] = await Promise.all([
        window.electron.course.getAll(),
        window.electron.instructor.getAll(),
        window.electron.room.getAll(),
        window.electron.section.getAll(),
      ]);

      if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data);
      if (instructorsRes.success && instructorsRes.data) setInstructors(instructorsRes.data);
      if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data);
      if (sectionsRes.success && sectionsRes.data) setSections(sectionsRes.data);
    } catch (err) {
      console.error('Failed to load dropdown data', err);
    }
  };

  const handleOpenModal = (schedule?: ScheduleWithDetails) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        course_id: schedule.course_id,
        instructor_id: schedule.instructor_id,
        room_id: schedule.room_id,
        section_id: schedule.section_id,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        available_space: schedule.available_space || 0,
        notes: schedule.notes || '',
      });
      // For grouped schedules, set all days
      const allDays = (schedule as any).days || [schedule.day];
      setSelectedDays(allDays);
    } else {
      setEditingSchedule(null);
      // Calculate available space based on first room
      const firstRoom = rooms[0];
      setFormData({
        course_id: courses[0]?.id || 0,
        instructor_id: instructors[0]?.id || 0,
        room_id: firstRoom?.id || 0,
        section_id: sections[0]?.id || 0,
        day: 'Monday',
        start_time: '08:00',
        end_time: '09:00',
        available_space: firstRoom?.capacity || 0,
        notes: '',
      });
      setSelectedDays(['Monday']);
    }
    setConflicts([]);
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setConflicts([]);
    setError(null);
  };

  const handleRoomChange = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    setFormData({
      ...formData,
      room_id: roomId,
      available_space: room?.capacity || 0,
    });
  };

  const handleDayToggle = (day: string) => {
    // Allow multiple days for both creating and editing
    if (selectedDays.includes(day)) {
      const newDays = selectedDays.filter(d => d !== day);
      setSelectedDays(newDays.length > 0 ? newDays : selectedDays);
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConflicts([]);

    // Validation
    if (!formData.course_id || !formData.instructor_id || !formData.room_id || !formData.section_id) {
      setError('Please select all required fields');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setError('End time must be after start time');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }

    try {
      if (editingSchedule) {
        // When editing, check conflicts for ALL days FIRST before making any changes
        const oldIds = (editingSchedule as any).ids || [editingSchedule.id];
        const allConflicts: Conflict[] = [];
        
        // Check conflicts for all selected days
        for (const day of selectedDays) {
          const scheduleData = { ...formData, day: day as typeof formData.day };
          const conflictResponse = await window.electron.schedule.detectConflicts(
            scheduleData,
            oldIds // Pass all old IDs to exclude all related schedule records
          );
          
          if (conflictResponse.success && conflictResponse.data && conflictResponse.data.length > 0) {
            allConflicts.push(...conflictResponse.data.map((c: Conflict) => ({ ...c, day })));
          }
        }
        
        // Deduplicate conflicts by schedule ID
        const uniqueConflicts = allConflicts.filter((conflict, index, self) => 
          index === self.findIndex((c) => c.id === conflict.id)
        );
        
        // If ANY conflicts found, stop and show errors
        if (uniqueConflicts.length > 0) {
          setConflicts(uniqueConflicts);
          setError(`Cannot update: ${uniqueConflicts.length} conflict(s) detected. Please resolve before saving.`);
          return;
        }
        
        // No conflicts - proceed with update
        // Delete all old instances
        for (const id of oldIds) {
          await window.electron.schedule.delete(id);
        }
        
        // Create new instances for selected days
        for (const day of selectedDays) {
          const scheduleData = { ...formData, day: day as typeof formData.day };
          await window.electron.schedule.create(scheduleData);
        }
        
        handleCloseModal();
        await loadSchedules();
      } else {
        // When creating, check conflicts for ALL days FIRST before inserting ANY records
        const allConflicts: Conflict[] = [];

        // Check conflicts for all selected days
        for (const day of selectedDays) {
          const scheduleData = { ...formData, day: day as typeof formData.day };
          const conflictResponse = await window.electron.schedule.detectConflicts(scheduleData);
          
          if (conflictResponse.success && conflictResponse.data && conflictResponse.data.length > 0) {
            allConflicts.push(...conflictResponse.data.map((c: Conflict) => ({ ...c, day })));
          }
        }

        // Deduplicate conflicts by schedule ID
        const uniqueConflicts = allConflicts.filter((conflict, index, self) => 
          index === self.findIndex((c) => c.id === conflict.id)
        );

        // If ANY conflicts found, stop and show errors - DO NOT INSERT
        if (uniqueConflicts.length > 0) {
          setConflicts(uniqueConflicts);
          setError(`Cannot create schedule: ${uniqueConflicts.length} conflict(s) detected. Please resolve before saving.`);
          return;
        }
        
        // No conflicts - proceed with creating all schedules
        for (const day of selectedDays) {
          const scheduleData = { ...formData, day: day as typeof formData.day };
          await window.electron.schedule.create(scheduleData);
        }
        
        // All successful
        handleCloseModal();
        await loadSchedules();
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDelete = async (schedule: ScheduleWithDetails) => {
    if (!confirm(`Are you sure you want to delete this schedule for "${schedule.course_code} - ${schedule.course_title}"?`)) {
      return;
    }

    setError(null);
    try {
      const response = await window.electron.schedule.delete(schedule.id);
      if (response.success) {
        await loadSchedules();
      } else {
        setError(response.message || 'Failed to delete schedule');
      }
    } catch (err) {
      setError('An error occurred while deleting');
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.room_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDay = !filterDay || schedule.day === filterDay;
    
    return matchesSearch && matchesDay;
  });

  // Group schedules by common properties (same course, instructor, room, section, time)
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const key = `${schedule.course_id}-${schedule.instructor_id}-${schedule.room_id}-${schedule.section_id}-${schedule.start_time}-${schedule.end_time}`;
    
    if (!acc[key]) {
      acc[key] = {
        ...schedule,
        days: [schedule.day],
        ids: [schedule.id]
      };
    } else {
      acc[key].days.push(schedule.day);
      acc[key].ids.push(schedule.id);
    }
    
    return acc;
  }, {} as Record<string, ScheduleWithDetails & { days: string[], ids: number[] }>);

  const displaySchedules = Object.values(groupedSchedules).sort((a, b) => {
    // Sort by course code with prefix grouping (CSE 101, CSE 102, CSE 201, then ENGL 101, ENGL 201, etc.)
    const codeA = (a.course_code || '').trim();
    const codeB = (b.course_code || '').trim();
    
    // Extract prefix (letters) and number parts
    const matchA = codeA.match(/^([A-Za-z]+)\s*(\d+)/);
    const matchB = codeB.match(/^([A-Za-z]+)\s*(\d+)/);
    
    if (matchA && matchB) {
      const prefixA = matchA[1].toUpperCase();
      const prefixB = matchB[1].toUpperCase();
      const numA = parseInt(matchA[2], 10);
      const numB = parseInt(matchB[2], 10);
      
      // First sort by prefix alphabetically
      if (prefixA !== prefixB) {
        return prefixA < prefixB ? -1 : 1;
      }
      // Then sort by number
      return numA - numB;
    }
    
    // Fallback to normal comparison
    return codeA.localeCompare(codeB);
  });

  const handleExportExcel = async () => {
    try {
      const response = await window.electron.export.toExcel(schedules);
      if (response.success) {
        alert(`Schedule exported successfully to:\n${response.data}`);
      } else {
        setError(response.message || 'Failed to export');
      }
    } catch (err) {
      setError('Error exporting to Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await window.electron.export.toPDF(schedules);
      if (response.success) {
        alert(`Schedule exported successfully to:\n${response.data}`);
      } else {
        setError(response.message || 'Failed to export');
      }
    } catch (err) {
      setError('Error exporting to PDF');
    }
  };

  const handleExportInstructorWorkload = async () => {
    try {
      const response = await window.electron.export.instructorWorkload(schedules);
      if (response.success) {
        alert(`Instructor workload report exported to:\n${response.data}`);
      } else {
        setError(response.message || 'Failed to export');
      }
    } catch (err) {
      setError('Error exporting workload report');
    }
  };

  const handleExportRoomUtilization = async () => {
    try {
      const response = await window.electron.export.roomUtilization(schedules);
      if (response.success) {
        alert(`Room utilization report exported to:\n${response.data}`);
      } else {
        setError(response.message || 'Failed to export');
      }
    } catch (err) {
      setError('Error exporting utilization report');
    }
  };

  const handleImportCSV = async () => {
    try {
      // Step 1: Validate the CSV file
      const validationResponse = await window.electron.import.validateCSV(courses, instructors, rooms, sections);
      
      if (!validationResponse.success || !validationResponse.data) {
        setError(validationResponse.message || 'Failed to validate CSV');
        return;
      }

      const { valid, invalid, conflicts } = validationResponse.data;
      
      // Show validation summary
      let confirmMessage = `📊 Import Validation Results:\n\n`;
      
      if (invalid.length > 0) {
        confirmMessage += `❌ VALIDATION ERRORS (${invalid.length}):\n`;
        confirmMessage += `The following rows have errors and cannot be imported:\n\n`;
        confirmMessage += invalid.slice(0, 10).join('\n\n') + '\n';
        if (invalid.length > 10) confirmMessage += `\n... and ${invalid.length - 10} more errors\n`;
        confirmMessage += `\n❌ Please fix these errors in your CSV file and try again.\n`;
        alert(confirmMessage);
        return;
      }

      confirmMessage += `✅ Valid schedule entries: ${valid.length}\n`;
      confirmMessage += `⚠️  Conflicting entries: ${conflicts.length}\n\n`;

      if (conflicts.length > 0) {
        confirmMessage += `⚠️  CONFLICTS DETECTED:\n`;
        confirmMessage += `The following will conflict with existing schedules:\n\n`;
        conflicts.slice(0, 5).forEach((c: any) => {
          confirmMessage += `Row ${c.rowNum} (${c.day}): ${c.course_code} Sec ${c.section_name} - ${c.instructor_name}\n`;
          confirmMessage += `  → ${c.conflicts.join(', ')}\n`;
        });
        if (conflicts.length > 5) {
          confirmMessage += `\n... and ${conflicts.length - 5} more conflicts\n`;
        }
        confirmMessage += `\n⚠️  Conflicting schedules will be SKIPPED during import.\n\n`;
      }

      if (valid.length === 0 && conflicts.length > 0) {
        alert(confirmMessage + '\n❌ All schedules have conflicts. Nothing to import.');
        return;
      }

      if (valid.length === 0) {
        alert(confirmMessage + '\n❌ No valid schedules to import.');
        return;
      }

      let proceedWithImport = false;
      
      if (conflicts.length > 0) {
        confirmMessage += `\nDo you want to proceed?\n`;
        confirmMessage += `• Click OK to import ONLY the ${valid.length} conflict-free schedules\n`;
        confirmMessage += `• Click Cancel to abort the import\n\n`;
        confirmMessage += `(Conflicting schedules will be skipped)`;
        
        proceedWithImport = confirm(confirmMessage);
      } else {
        confirmMessage += `\n✅ All schedules are valid with no conflicts!\n\nProceed with import?`;
        proceedWithImport = confirm(confirmMessage);
      }

      if (!proceedWithImport) {
        return;
      }

      // Step 2: Import only valid, non-conflicting schedules
      const importResponse = await window.electron.import.fromCSV(valid, false);
      
      if (importResponse.success && importResponse.data) {
        let resultMessage = `✅ Import Completed!\n\n`;
        resultMessage += `📥 ${importResponse.data.imported} schedules imported successfully\n`;
        if (conflicts.length > 0) {
          resultMessage += `⏭️  ${conflicts.length} conflicting schedules skipped\n`;
        }
        if (importResponse.data.errors.length > 0) {
          resultMessage += `❌ ${importResponse.data.errors.length} errors during import\n\n`;
          resultMessage += importResponse.data.errors.slice(0, 3).join('\n');
          if (importResponse.data.errors.length > 3) {
            resultMessage += `\n... and ${importResponse.data.errors.length - 3} more errors`;
          }
        }
        alert(resultMessage);
        loadSchedules();
      } else {
        setError(importResponse.message || 'Failed to import');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Error importing CSV');
    }
  };

  const handleDownloadSampleCSV = async () => {
    try {
      const csvContent = await window.electron.import.generateSampleCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_schedule_import.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error generating sample CSV');
    }
  };

  const handleShowResolutionOptions = async () => {
    setResolutionLoading(true);
    setShowResolutionModal(true);
    
    const oldIds = editingSchedule ? [(editingSchedule as any).ids || [editingSchedule.id]].flat() : [];
    
    try {
      // Get alternative times
      const timesResponse = await window.electron.resolution.suggestAlternativeTimes(formData, oldIds);
      if (timesResponse.success && timesResponse.data) {
        setAlternativeTimes(timesResponse.data);
      }

      // Get alternative rooms
      const roomsResponse = await window.electron.resolution.suggestAlternativeRooms(formData, oldIds);
      if (roomsResponse.success && roomsResponse.data) {
        setAlternativeRooms(roomsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching resolution options:', err);
    } finally {
      setResolutionLoading(false);
    }
  };

  const handleApplyAlternativeTime = (alternative: any) => {
    // Apply the suggested days (array) and preserve section
    setFormData({
      ...formData,
      day: alternative.days[0], // Set first day as default for form
      start_time: alternative.start_time,
      end_time: alternative.end_time,
      section_id: alternative.section_id || formData.section_id, // Preserve section
    });
    setSelectedDays(alternative.days); // Set all suggested days
    setShowResolutionModal(false);
    setConflicts([]);
    setError(null);
  };

  const handleApplyAlternativeRoom = (alternative: any) => {
    setFormData({
      ...formData,
      room_id: alternative.room_id,
      available_space: alternative.capacity,
    });
    setShowResolutionModal(false);
    setConflicts([]);
    setError(null);
  };

  const handleAutoResolve = async () => {
    setResolutionLoading(true);
    const oldIds = editingSchedule ? [(editingSchedule as any).ids || [editingSchedule.id]].flat() : [];
    
    try {
      const response = await window.electron.resolution.autoResolve(formData, oldIds);
      if (response.success && response.data) {
        setFormData({
          ...formData,
          course_id: response.data.course_id,
          instructor_id: response.data.instructor_id,
          room_id: response.data.room_id,
          section_id: response.data.section_id,
          day: response.data.days[0], // Set first day as default
          start_time: response.data.start_time,
          end_time: response.data.end_time,
          available_space: response.data.available_space,
        });
        setSelectedDays(response.data.days); // Set all resolved days
        setShowResolutionModal(false);
        setConflicts([]);
        setError(null);
        alert(response.message || '✅ Conflict-free schedule found! Review and save.');
      } else {
        alert('❌ ' + (response.message || 'Could not find a conflict-free slot'));
      }
    } catch (err) {
      alert('Error during auto-resolve');
    } finally {
      setResolutionLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schedule Management</h1>
        <div className="flex gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              📊 Export
              <span className="text-xs">{showExportDropdown ? '▲' : '▼'}</span>
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={() => { handleExportExcel(); setShowExportDropdown(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-md"
                >
                  📗 Export to Excel
                </button>
                <button
                  onClick={() => { handleExportPDF(); setShowExportDropdown(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  📕 Export to PDF
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { handleExportInstructorWorkload(); setShowExportDropdown(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  👨‍🏫 Instructor Workload
                </button>
                <button
                  onClick={() => { handleExportRoomUtilization(); setShowExportDropdown(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-md"
                >
                  🏢 Room Utilization
                </button>
              </div>
            )}
          </div>

          {/* Import Dropdown */}
          <div className="relative" ref={importDropdownRef}>
            <button 
              onClick={() => setShowImportDropdown(!showImportDropdown)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
            >
              📥 Import
              <span className="text-xs">{showImportDropdown ? '▲' : '▼'}</span>
            </button>
            {showImportDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={() => { handleImportCSV(); setShowImportDropdown(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-md"
                >
                  📄 Import from CSV
                </button>
                <button
                  onClick={() => { handleDownloadSampleCSV(); setShowImportDropdown(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-md"
                >
                  📋 Download Sample CSV
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleCleanupOrphaned}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center gap-2"
            title="Remove schedules for deleted courses, instructors, rooms, or sections"
          >
            🧹 Cleanup Orphaned
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {error && !showModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Orphaned schedules warning */}
      {schedules.some(s => !s.course_code || !s.instructor_name || !s.room_name || !s.section_name) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <div className="flex items-start gap-2">
            <span className="text-xl">🗑️</span>
            <div>
              <p className="font-semibold">Orphaned Schedules Detected</p>
              <p className="text-sm">Some schedules reference deleted courses, instructors, rooms, or sections. These are highlighted in yellow and marked with 🗑️. Use the "🧹 Cleanup Orphaned" button to remove them.</p>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-white shadow' : ''}`}
          >
            Calendar View
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search courses, instructors, rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded"
        />
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="">All Days</option>
          {days.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        loading ? (
          <div className="text-center py-8">Loading schedules...</div>
        ) : (
          <WeeklyCalendar 
            schedules={filteredSchedules}
            onScheduleClick={(schedule) => handleOpenModal(schedule)}
          />
        )
      ) : (
        /* List View */
        loading ? (
          <div className="text-center py-8">Loading schedules...</div>
        ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displaySchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No schedules found
                  </td>
                </tr>
              ) : (
                displaySchedules.map((schedule) => {
                  // Check if any of the schedule IDs have conflicts
                  const hasConflict = schedule.ids.some(id => scheduleConflicts.get(id));
                  
                  // Check if schedule is orphaned (missing related data)
                  const isOrphaned = !schedule.course_code || !schedule.instructor_name || !schedule.room_name || !schedule.section_name;
                  
                  return (
                  <tr key={schedule.ids.join('-')} className={`${hasConflict ? 'bg-red-50 border-l-4 border-red-500' : isOrphaned ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {hasConflict && (
                          <span className="text-red-600 text-lg" title="This schedule has conflicts">⚠️</span>
                        )}
                        {isOrphaned && (
                          <span className="text-yellow-600 text-lg" title="Course, instructor, room, or section was deleted">🗑️</span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{schedule.course_code || '(Deleted Course)'}</div>
                          <div className="text-sm text-gray-500">{schedule.course_title || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.section_name || '(Deleted)'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.instructor_name || '(Deleted)'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.room_name || '(Deleted)'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {schedule.days.sort((a, b) => {
                          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          return dayOrder.indexOf(a) - dayOrder.indexOf(b);
                        }).map(day => (
                          <span key={day} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {day.substring(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTimeRange(schedule.start_time, schedule.end_time)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {schedule.available_space} / {schedule.room_capacity}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(schedule)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          // Delete all schedule instances (all days)
                          for (const id of schedule.ids) {
                            await handleDelete({ ...schedule, id });
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )
      )}

      {/* Conflict/Error Popup Modal */}
      {(error || conflicts.length > 0) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="rounded-lg shadow-2xl p-6 max-w-lg w-full mx-4 animate-shake" style={{ backgroundColor: '#ffffff' }}>
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10" style={{ color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-xl font-bold" style={{ color: '#991b1b' }}>
                  {conflicts.length > 0 ? `⚠️ ${conflicts.length} Conflict(s) Detected` : '⚠️ Error'}
                </h3>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#fee2e2' }}>
                <p className="font-semibold" style={{ color: '#7f1d1d' }}>{error}</p>
              </div>
            )}
            
            {conflicts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm mb-2 font-bold" style={{ color: '#7f1d1d' }}>The following conflicts were found:</p>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx} className="border rounded px-3 py-2 text-sm" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                      <span className="font-bold" style={{ color: '#7f1d1d' }}>{conflict.conflict_type}:</span>
                      <br />
                      <span className="font-medium" style={{ color: '#991b1b' }}>{conflict.resource_name} - {conflict.day} {formatTimeRange(conflict.start_time, conflict.end_time)}</span>
                    </li>
                  ))}
                </ul>
                {conflicts.some(c => c.conflict_type === 'Duplicate Time Slot') && (
                  <div className="mt-3 p-3 border rounded" style={{ backgroundColor: '#fef3c7', borderColor: '#fbbf24' }}>
                    <p className="text-sm font-semibold" style={{ color: '#78350f' }}>
                      <strong>⚠️ Duplicate Section Time Detected:</strong> This course-section-instructor combination already exists with different times. 
                      Alternative suggestions cannot resolve this. Please choose a different section number or edit the existing schedule.
                    </p>
                  </div>
                )}
                <p className="mt-3 text-xs italic" style={{ color: '#7f1d1d' }}>No changes have been saved. Please resolve conflicts before proceeding.</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              {conflicts.length > 0 && (
                <div className="flex gap-2">
                  {conflicts.some(c => c.conflict_type === 'Duplicate Time Slot') ? (
                    <div className="text-sm text-yellow-700 italic">
                      Cannot auto-resolve duplicate section conflicts
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleShowResolutionOptions}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                      >
                        🔍 Suggest Alternatives
                      </button>
                      <button
                        onClick={handleAutoResolve}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm"
                      >
                        ⚡ Auto-Resolve
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setError(null);
                  setConflicts([]);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Options Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70]">
          <div className="rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2" style={{ backgroundColor: '#ffffff', borderColor: '#195630' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2" style={{ borderColor: '#E1A722' }}>
              <span className="text-4xl">🔍</span>
              <h3 className="text-2xl font-bold" style={{ color: '#195630' }}>Resolution Options</h3>
            </div>
            
            {/* Current Schedule Info */}
            <div className="mb-6 p-4 border-l-4 rounded-r" style={{ backgroundColor: '#e8f5e9', borderColor: '#195630' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#195630' }}>📋 Current Schedule:</p>
              <p className="text-sm font-medium" style={{ color: '#1e293b' }}>
                {courses.find(c => c.id === formData.course_id)?.code || 'N/A'} • {' '}
                Section {sections.find(s => s.id === formData.section_id)?.name || 'N/A'} • {' '}
                {instructors.find(i => i.id === formData.instructor_id)?.name || 'N/A'} • {' '}
                {rooms.find(r => r.id === formData.room_id)?.name || 'N/A'}
              </p>
            </div>
            
            {resolutionLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4" style={{ color: '#4b5563' }}>Finding alternatives...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Alternative Times */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border" style={{ borderColor: '#3b82f6' }}>
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1e40af' }}>
                    <span className="text-2xl">⏰</span>
                    Alternative Time Slots
                  </h4>
                  {alternativeTimes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {alternativeTimes.map((alt, idx) => (
                        <div 
                          key={idx}
                          className="border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                          style={alt.conflicts === 0 ? 
                            { backgroundColor: '#d1fae5', borderColor: '#10b981', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' } : 
                            { backgroundColor: '#ffffff', borderColor: '#94a3b8' }
                          }
                          onClick={() => handleApplyAlternativeTime(alt)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-bold text-base mb-1" style={{ color: '#1e293b' }}>{alt.days.join(' / ')}</p>
                              <p className="text-sm font-medium" style={{ color: '#475569' }}>{formatTimeRange(alt.start_time, alt.end_time)}</p>
                            </div>
                            <span 
                              className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ml-2"
                              style={alt.conflicts === 0 ? 
                                { backgroundColor: '#059669', color: '#ffffff' } : 
                                { backgroundColor: '#fed7aa', color: '#9a3412' }
                              }
                            >
                              {alt.conflicts === 0 ? '✓ Available' : `⚠ ${alt.conflicts} conflict(s)`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium" style={{ color: '#64748b' }}>No alternative times available</p>
                  )}
                </div>

                {/* Alternative Rooms */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border" style={{ borderColor: '#a855f7' }}>
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#7c3aed' }}>
                    <span className="text-2xl">🏢</span>
                    Alternative Rooms
                  </h4>
                  {alternativeRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {alternativeRooms.map((alt, idx) => (
                        <div 
                          key={idx}
                          className="border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                          style={alt.conflicts === 0 ? 
                            { backgroundColor: '#ddd6fe', borderColor: '#8b5cf6', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)' } : 
                            { backgroundColor: '#ffffff', borderColor: '#94a3b8' }
                          }
                          onClick={() => handleApplyAlternativeRoom(alt)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-base mb-1" style={{ color: '#1e293b' }}>{alt.room_name}</p>
                              <p className="text-sm font-medium" style={{ color: '#475569' }}>Capacity: {alt.capacity}</p>
                            </div>
                            <span 
                              className="text-xs font-bold px-3 py-1 rounded-full"
                              style={alt.conflicts === 0 ? 
                                { backgroundColor: '#7c3aed', color: '#ffffff' } : 
                                { backgroundColor: '#fed7aa', color: '#9a3412' }
                              }
                            >
                              {alt.conflicts === 0 ? '✓ Available' : `⚠ ${alt.conflicts} conflict(s)`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium" style={{ color: '#64748b' }}>No alternative rooms available</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowResolutionModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  >
                    <option value={0}>Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  >
                    <option value={0}>Select Section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor *
                  </label>
                  <select
                    value={formData.instructor_id}
                    onChange={(e) => setFormData({ ...formData, instructor_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  >
                    <option value={0}>Select Instructor</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room *
                  </label>
                  <select
                    value={formData.room_id}
                    onChange={(e) => handleRoomChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  >
                    <option value={0}>Select Room</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingSchedule ? 'Day *' : 'Days * (Select multiple for the same course)'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {days.map(day => (
                      <label key={day} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Space
                  </label>
                  <input
                    type="number"
                    value={formData.available_space}
                    onChange={(e) => setFormData({ ...formData, available_space: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingSchedule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
