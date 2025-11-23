import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScheduleWithDetails, ApiResponse } from '../../shared/types';
import { app } from 'electron';
import * as path from 'path';
import { formatTimeRange } from '../../utils/timeFormat';

export class ExportService {
  /**
   * Group schedules by course, section, instructor, room, and time
   * Returns grouped schedules with combined days
   */
  private static groupSchedules(schedules: ScheduleWithDetails[]): Array<ScheduleWithDetails & { days: string[] }> {
    const groupedMap = new Map<string, ScheduleWithDetails & { days: string[] }>();

    schedules.forEach(schedule => {
      const key = `${schedule.course_id}-${schedule.section_id}-${schedule.instructor_id}-${schedule.room_id}-${schedule.start_time}-${schedule.end_time}`;
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ...schedule,
          days: [schedule.day],
        });
      } else {
        groupedMap.get(key)!.days.push(schedule.day);
      }
    });

    // Sort by course code
    return Array.from(groupedMap.values()).sort((a, b) => {
      const codeA = (a.course_code || '').trim();
      const codeB = (b.course_code || '').trim();
      
      const matchA = codeA.match(/^([A-Za-z]+)\s*(\d+)/);
      const matchB = codeB.match(/^([A-Za-z]+)\s*(\d+)/);
      
      if (matchA && matchB) {
        const prefixA = matchA[1].toUpperCase();
        const prefixB = matchB[1].toUpperCase();
        const numA = parseInt(matchA[2], 10);
        const numB = parseInt(matchB[2], 10);
        
        if (prefixA !== prefixB) {
          return prefixA < prefixB ? -1 : 1;
        }
        return numA - numB;
      }
      
      return codeA.localeCompare(codeB);
    });
  }

  /**
   * Export schedules to Excel format
   */
  static async toExcel(schedules: ScheduleWithDetails[], filepath?: string): Promise<ApiResponse<string>> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Schedule');

      // Define columns matching PRD requirements
      worksheet.columns = [
        { header: 'Course Code', key: 'course_code', width: 12 },
        { header: 'Course Title', key: 'course_title', width: 30 },
        { header: 'Credit Hours', key: 'credits', width: 12 },
        { header: 'Section', key: 'section_name', width: 10 },
        { header: 'Location', key: 'room_name', width: 20 },
        { header: 'Days', key: 'days', width: 15 },
        { header: 'Time', key: 'time', width: 15 },
        { header: 'Available Space', key: 'available_space', width: 15 },
        { header: 'Instructor', key: 'instructor_name', width: 25 },
      ];

      // Group schedules by common attributes
      const groupedSchedules = this.groupSchedules(schedules);

      // Add data rows
      groupedSchedules.forEach(group => {
        worksheet.addRow({
          course_code: group.course_code,
          course_title: group.course_title,
          credits: group.course_credits || 3,
          section_name: group.section_name,
          room_name: group.room_name,
          days: group.days.join(', '),
          time: formatTimeRange(group.start_time, group.end_time),
          available_space: group.available_space || group.room_capacity || 0,
          instructor_name: group.instructor_name,
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Save file
      const savePath = filepath || path.join(app.getPath('downloads'), `TU_Schedule_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(savePath);

      return { 
        success: true, 
        message: 'Excel file exported successfully',
        data: savePath 
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export Excel file',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Export schedules to PDF format
   */
  static async toPDF(schedules: ScheduleWithDetails[], filepath?: string): Promise<ApiResponse<string>> {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Try to add logo (if available)
      try {
        const fs = require('fs');
        const logoPath = path.join(process.cwd(), 'public', 'assets', 'TU_Logo.png');
        if (fs.existsSync(logoPath)) {
          const logoData = fs.readFileSync(logoPath).toString('base64');
          doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', 10, 5, 25, 25);
        }
      } catch (err) {
        // Logo not available, continue without it
        console.log('Logo not found, continuing without it');
      }

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Tubman University - Class Schedule', 148, 15, { align: 'center' });
      
      // Add date/time
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      doc.text(`Generated: ${dateStr} at ${timeStr}`, 148, 21, { align: 'center' });

      // Group schedules
      const groupedSchedules = this.groupSchedules(schedules);

      // Prepare table data
      const tableData = groupedSchedules.map(group => [
        group.course_code || '',
        group.course_title || '',
        (group.course_credits || 3).toString(),
        group.section_name || '',
        group.room_name || '',
        group.days.join(', '),
        formatTimeRange(group.start_time, group.end_time),
        (group.available_space || group.room_capacity || 0).toString(),
        group.instructor_name || '',
      ]);

      // Generate table (adjusted startY for logo and date)
      autoTable(doc, {
        head: [['Code', 'Course Title', 'Credits', 'Section', 'Location', 'Days', 'Time', 'Space', 'Instructor']],
        body: tableData,
        startY: 32,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [25, 86, 48], textColor: 255, fontStyle: 'bold' }, // TU Dark Spruce color
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 15 },
          3: { cellWidth: 18 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25 },
          7: { cellWidth: 15 },
          8: { cellWidth: 40 },
        },
        margin: { left: 10, right: 10 },
      });

      // Save file
      const savePath = filepath || path.join(app.getPath('downloads'), `TU_Schedule_${Date.now()}.pdf`);
      doc.save(savePath);

      return { 
        success: true, 
        message: 'PDF file exported successfully',
        data: savePath 
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export PDF file',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Export instructor workload report to Excel
   */
  static async exportInstructorWorkload(schedules: ScheduleWithDetails[], filepath?: string): Promise<ApiResponse<string>> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Instructor Workload');

      // Group by instructor
      const instructorMap = new Map<string, {
        name: string;
        courses: number;
        sections: number;
        totalHours: number;
        schedules: ScheduleWithDetails[];
      }>();

      schedules.forEach(schedule => {
        const key = schedule.instructor_name || 'Unknown';
        if (!instructorMap.has(key)) {
          instructorMap.set(key, {
            name: schedule.instructor_name || 'Unknown',
            courses: 0,
            sections: 0,
            totalHours: 0,
            schedules: [],
          });
        }

        const instructor = instructorMap.get(key)!;
        instructor.schedules.push(schedule);
      });

      // Calculate workload
      instructorMap.forEach(instructor => {
        const uniqueCourses = new Set(instructor.schedules.map(s => s.course_id));
        const uniqueSections = new Set(instructor.schedules.map(s => `${s.course_id}-${s.section_id}`));
        
        instructor.courses = uniqueCourses.size;
        instructor.sections = uniqueSections.size;

        // Calculate total teaching hours per week
        uniqueSections.forEach(sectionKey => {
          const sectionSchedules = instructor.schedules.filter(s => `${s.course_id}-${s.section_id}` === sectionKey);
          if (sectionSchedules.length > 0) {
            const schedule = sectionSchedules[0];
            const [startHour, startMin] = schedule.start_time.split(':').map(Number);
            const [endHour, endMin] = schedule.end_time.split(':').map(Number);
            const hoursPerClass = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
            const daysPerWeek = sectionSchedules.length;
            instructor.totalHours += hoursPerClass * daysPerWeek;
          }
        });
      });

      // Define columns
      worksheet.columns = [
        { header: 'Instructor', key: 'name', width: 30 },
        { header: 'Courses', key: 'courses', width: 12 },
        { header: 'Sections', key: 'sections', width: 12 },
        { header: 'Weekly Hours', key: 'totalHours', width: 15 },
      ];

      // Add data
      Array.from(instructorMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(instructor => {
          worksheet.addRow({
            name: instructor.name,
            courses: instructor.courses,
            sections: instructor.sections,
            totalHours: instructor.totalHours.toFixed(2),
          });
        });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Save file
      const savePath = filepath || path.join(app.getPath('downloads'), `Instructor_Workload_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(savePath);

      return { 
        success: true, 
        message: 'Instructor workload report exported successfully',
        data: savePath 
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export instructor workload report',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Export room utilization report to Excel
   */
  static async exportRoomUtilization(schedules: ScheduleWithDetails[], filepath?: string): Promise<ApiResponse<string>> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Room Utilization');

      // Group by room
      const roomMap = new Map<string, {
        name: string;
        capacity: number;
        totalSlots: number;
        schedules: ScheduleWithDetails[];
      }>();

      schedules.forEach(schedule => {
        const key = schedule.room_name || 'Unknown';
        if (!roomMap.has(key)) {
          roomMap.set(key, {
            name: schedule.room_name || 'Unknown',
            capacity: schedule.room_capacity || 0,
            totalSlots: 0,
            schedules: [],
          });
        }

        roomMap.get(key)!.schedules.push(schedule);
      });

      // Calculate utilization
      roomMap.forEach(room => {
        // Count unique time slots (day + time combination)
        const uniqueSlots = new Set(room.schedules.map(s => `${s.day}-${s.start_time}-${s.end_time}`));
        room.totalSlots = uniqueSlots.size;
      });

      // Define columns
      worksheet.columns = [
        { header: 'Room', key: 'name', width: 25 },
        { header: 'Capacity', key: 'capacity', width: 12 },
        { header: 'Time Slots Used', key: 'totalSlots', width: 18 },
        { header: 'Total Classes', key: 'classes', width: 15 },
      ];

      // Add data
      Array.from(roomMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(room => {
          worksheet.addRow({
            name: room.name,
            capacity: room.capacity,
            totalSlots: room.totalSlots,
            classes: room.schedules.length,
          });
        });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Save file
      const savePath = filepath || path.join(app.getPath('downloads'), `Room_Utilization_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(savePath);

      return { 
        success: true, 
        message: 'Room utilization report exported successfully',
        data: savePath 
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export room utilization report',
        error: (error as Error).message,
      };
    }
  }
}
