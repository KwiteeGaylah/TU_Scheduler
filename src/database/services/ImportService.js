"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const fs_1 = __importDefault(require("fs"));
const exceljs_1 = __importDefault(require("exceljs"));
const CourseService_1 = require("./CourseService");
const InstructorService_1 = require("./InstructorService");
const RoomService_1 = require("./RoomService");
class ImportService {
    static async fromCsv(filePath) {
        try {
            const content = fs_1.default.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            const headers = lines[0].split(',').map((h) => h.trim());
            let imported = 0;
            let errors = 0;
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim())
                    continue;
                const values = lines[i].split(',').map((v) => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                try {
                    // Determine what type of data is being imported based on headers
                    if (headers.includes('course_code') || headers.includes('code')) {
                        await CourseService_1.CourseService.create({
                            code: row.code || row.course_code,
                            title: row.title || row.course_title,
                            credits: parseInt(row.credits || row.course_credits),
                            department: row.department,
                        });
                    }
                    else if (headers.includes('instructor_name') || headers.includes('name')) {
                        await InstructorService_1.InstructorService.create({
                            name: row.name || row.instructor_name,
                            email: row.email,
                            phone: row.phone,
                            department: row.department,
                        });
                    }
                    else if (headers.includes('room_name') || (headers.includes('name') && headers.includes('capacity'))) {
                        await RoomService_1.RoomService.create({
                            name: row.name || row.room_name,
                            capacity: parseInt(row.capacity),
                            building: row.building,
                        });
                    }
                    imported++;
                }
                catch (error) {
                    errors++;
                    console.error(`Error importing row ${i}:`, error);
                }
            }
            return {
                success: true,
                message: `Imported ${imported} records with ${errors} errors`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to import CSV file',
                error: error.message,
            };
        }
    }
    static async fromExcel(filePath) {
        try {
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.readFile(filePath);
            let imported = 0;
            let errors = 0;
            workbook.eachSheet((worksheet) => {
                const headers = [];
                let headerRow;
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) {
                        headerRow = row;
                        row.eachCell((cell) => {
                            headers.push(cell.value);
                        });
                    }
                    else {
                        const rowData = {};
                        row.eachCell((cell, colNumber) => {
                            rowData[headers[colNumber - 1]] = cell.value;
                        });
                        try {
                            // Import based on sheet name or headers
                            if (worksheet.name.toLowerCase().includes('course') ||
                                headers.includes('course_code')) {
                                CourseService_1.CourseService.create({
                                    code: rowData.code || rowData.course_code,
                                    title: rowData.title || rowData.course_title,
                                    credits: parseInt(rowData.credits || rowData.course_credits),
                                    department: rowData.department,
                                });
                            }
                            else if (worksheet.name.toLowerCase().includes('instructor') ||
                                headers.includes('instructor_name')) {
                                InstructorService_1.InstructorService.create({
                                    name: rowData.name || rowData.instructor_name,
                                    email: rowData.email,
                                    phone: rowData.phone,
                                    department: rowData.department,
                                });
                            }
                            else if (worksheet.name.toLowerCase().includes('room') ||
                                headers.includes('room_name')) {
                                RoomService_1.RoomService.create({
                                    name: rowData.name || rowData.room_name,
                                    capacity: parseInt(rowData.capacity),
                                    building: rowData.building,
                                });
                            }
                            imported++;
                        }
                        catch (error) {
                            errors++;
                            console.error(`Error importing row ${rowNumber}:`, error);
                        }
                    }
                });
            });
            return {
                success: true,
                message: `Imported ${imported} records with ${errors} errors`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to import Excel file',
                error: error.message,
            };
        }
    }
}
exports.ImportService = ImportService;
