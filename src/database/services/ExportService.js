"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
class ExportService {
    static async toExcel(schedules, filePath) {
        try {
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet('Schedule');
            // Define columns
            worksheet.columns = [
                { header: 'Course Code', key: 'course_code', width: 12 },
                { header: 'Course Description', key: 'course_title', width: 30 },
                { header: 'Credit Hours', key: 'course_credits', width: 12 },
                { header: 'Section', key: 'section_name', width: 10 },
                { header: 'Location', key: 'room_name', width: 15 },
                { header: 'Days', key: 'day', width: 12 },
                { header: 'Time', key: 'time', width: 20 },
                { header: 'Available Space', key: 'available_space', width: 15 },
                { header: 'Instructor', key: 'instructor_name', width: 25 },
            ];
            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0284c7' },
            };
            worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
            // Add data
            schedules.forEach((schedule) => {
                worksheet.addRow({
                    course_code: schedule.course_code,
                    course_title: schedule.course_title,
                    course_credits: schedule.course_credits,
                    section_name: schedule.section_name,
                    room_name: schedule.room_name,
                    day: schedule.day,
                    time: `${schedule.start_time} - ${schedule.end_time}`,
                    available_space: schedule.available_space || schedule.room_capacity,
                    instructor_name: schedule.instructor_name,
                });
            });
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
            await workbook.xlsx.writeFile(filePath);
            return { success: true, message: 'Excel file exported successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to export Excel file',
                error: error.message,
            };
        }
    }
    static async toPdf(schedules, filePath) {
        try {
            // For PDF generation, we'll use Puppeteer to convert HTML to PDF
            const puppeteer = require('puppeteer');
            // Generate HTML table
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0284c7; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>TU Class Schedule</h1>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Description</th>
                <th>Credit Hours</th>
                <th>Section</th>
                <th>Location</th>
                <th>Days</th>
                <th>Time</th>
                <th>Available Space</th>
                <th>Instructor</th>
              </tr>
            </thead>
            <tbody>
              ${schedules
                .map((s) => `
                <tr>
                  <td>${s.course_code}</td>
                  <td>${s.course_title}</td>
                  <td>${s.course_credits}</td>
                  <td>${s.section_name}</td>
                  <td>${s.room_name}</td>
                  <td>${s.day}</td>
                  <td>${s.start_time} - ${s.end_time}</td>
                  <td>${s.available_space || s.room_capacity}</td>
                  <td>${s.instructor_name}</td>
                </tr>
              `)
                .join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
            await page.setContent(html);
            await page.pdf({
                path: filePath,
                format: 'A4',
                landscape: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            });
            await browser.close();
            return { success: true, message: 'PDF file exported successfully' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to export PDF file',
                error: error.message,
            };
        }
    }
}
exports.ExportService = ExportService;
