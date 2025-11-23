# Schedule Import/Export Guide

## Exporting Schedules

### Excel Export
- **Location:** Schedule Management page → 📊 Export → 📗 Export to Excel
- **Format:** .xlsx file
- **Columns:** Course Code, Course Title, Credit Hours, Section, Location, Days, Time, Available Space, Instructor
- **Features:** 
  - Grouped by schedule (multiple days shown in single row)
  - Sorted by course code
  - Professional formatting with headers and borders
  - Saves to Downloads folder

### PDF Export  
- **Location:** Schedule Management page → 📊 Export → 📕 Export to PDF
- **Format:** .pdf file (landscape A4)
- **Features:**
  - Print-ready format
  - Same columns as Excel
  - Professional table layout
  - Saves to Downloads folder

### Reports

#### Instructor Workload Report
- **Location:** Schedule Management page → 📊 Export → 👨‍🏫 Instructor Workload
- **Shows:** 
  - Number of courses per instructor
  - Number of sections per instructor
  - Total weekly teaching hours
  - Excel format

#### Room Utilization Report
- **Location:** Schedule Management page → 📊 Export → 🏢 Room Utilization
- **Shows:**
  - Room capacity
  - Number of time slots used
  - Total number of classes
  - Excel format

---

## Importing Schedules

### CSV Import

#### Step 1: Download Sample Template
1. Go to Schedule Management page
2. Click **📥 Import** → **📋 Download Sample CSV**
3. Save `sample_schedule_import.csv` to your computer

#### Step 2: Prepare Your CSV File
The CSV file must have these columns in this exact order:

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| `course_code` | Course code (must exist in system) | CSE 101 | ✅ Yes |
| `course_title` | Course title (optional, for reference) | Introduction to Computers | No |
| `credits` | Credit hours (optional, for reference) | 3 | No |
| `section_name` | Section name (must exist in system) | 1 | ✅ Yes |
| `instructor_name` | Instructor name (must exist in system) | John Doe | ✅ Yes |
| `room_name` | Room name (must exist in system) | Computer Lab A | ✅ Yes |
| `days` | Days (comma-separated) | "Monday, Wednesday" | ✅ Yes |
| `start_time` | Start time in HH:MM format | 08:00 | ✅ Yes |
| `end_time` | End time in HH:MM format | 09:30 | ✅ Yes |
| `available_space` | Available seats (optional, defaults to room capacity) | 30 | No |

#### Step 3: Important Rules

**Days Format:**
- Use full day names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
- Multiple days must be comma-separated: `"Monday, Wednesday, Friday"`
- Use quotes if comma-separated

**Time Format:**
- Use 24-hour format: HH:MM
- Examples: `08:00`, `14:30`, `16:00`
- Must include leading zero: `08:00` not `8:00`

**Prerequisites:**
- All courses must exist in the Courses page
- All instructors must exist in the Instructors page
- All rooms must exist in the Rooms page
- All sections must exist in the Sections page

#### Step 4: Import the File
1. Go to Schedule Management page
2. Click **📥 Import** → **📄 Import from CSV**
3. Select your prepared CSV file
4. Review the import summary:
   - Number of schedules successfully imported
   - List of any errors (if any)

---

## Sample CSV Content

```csv
course_code,course_title,section_name,instructor_name,room_name,days,start_time,end_time,available_space
CSE 101,Introduction to Computers,1,John Doe,Computer Lab A,"Monday, Wednesday",08:00,09:30,30
ENGL 201,Technical Communication,2,Jane Smith,Lecture Hall 1,"Tuesday, Thursday",10:00,11:30,50
CSE 102,Computer Literacy,1,John Doe,Computer Lab B,"Wednesday, Friday",14:00,15:30,25
```

---

## Conflict Detection During Import

The import process automatically checks for conflicts:
- **Instructor conflicts:** Same instructor at same time
- **Room conflicts:** Same room at same time  
- **Section conflicts:** Same section at same time
- **Duplicate time slots:** Same course-section-instructor combination
- **Course-section assignments:** Prevent reassigning sections to different instructors

If conflicts are detected, those specific schedules will be skipped and listed in the error report.

---

## Troubleshooting

### Common Import Errors

**"Course not found"**
- Solution: Add the course in the Courses page first

**"Instructor not found"**
- Solution: Add the instructor in the Instructors page first

**"Room not found"**
- Solution: Add the room in the Rooms page first

**"Section not found"**
- Solution: Add the section in the Sections page first

**"Invalid time format"**
- Solution: Use HH:MM format (e.g., `08:00` not `8:00 AM`)

**"Invalid days"**
- Solution: Use full day names (Monday, Tuesday, etc.) and separate with commas

**"Conflicts detected"**
- Solution: Review the conflict details and adjust the schedule to avoid overlaps

---

## File Locations

- **Exports:** Saved to your Downloads folder
- **Sample CSV:** Available via Download Sample CSV button

---

## Tips

1. **Start Small:** Test with a few schedules first
2. **Use Sample:** Base your CSV on the downloaded sample template
3. **Check Prerequisites:** Ensure all courses, instructors, rooms, and sections exist
4. **Review Errors:** Read the error report carefully if import fails
5. **Backup First:** Export existing schedules before importing new ones

---

## Need Help?

If you encounter issues:
1. Download the sample CSV template
2. Verify all required data exists in the system
3. Check for typos in course codes, instructor names, room names
4. Ensure time format is correct (HH:MM)
5. Verify day names are spelled correctly
