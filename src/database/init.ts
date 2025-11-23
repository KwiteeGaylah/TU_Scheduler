import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { DB_NAME } from '../shared/constants';

let db: SqlJsDatabase | null = null;
let dbPath: string;

export const getDatabase = (): SqlJsDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  // Ensure foreign keys are always enabled
  db.exec('PRAGMA foreign_keys = ON');
  return db;
};

export const closeDatabase = () => {
  if (db) {
    // Save database to file before closing
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    db.close();
    db = null;
  }
};

// Helper to save database periodically
export const saveDatabase = () => {
  if (db && dbPath) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
};

export const initDatabase = async (): Promise<void> => {
  const wasmPath = path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({
    wasmBinary: wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength)
  });

  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, DB_NAME);

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign key constraints (MUST use exec, not run)
  db.exec('PRAGMA foreign_keys = ON');

  const database = db;

  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'registrar', 'viewer')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create settings table for application configuration
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_semester TEXT NOT NULL DEFAULT 'Semester 1',
      academic_year TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default settings if not exists
  database.exec(`
    INSERT OR IGNORE INTO settings (id, active_semester, academic_year)
    VALUES (1, 'Semester 1', '2024-2025')
  `);

  // Create courses table
  database.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      credits INTEGER NOT NULL,
      department TEXT,
      description TEXT,
      semester TEXT NOT NULL DEFAULT 'Semester 1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(code, semester)
    )
  `);

  // Migration: Add semester column to existing courses table if it doesn't exist
  try {
    const coursesInfo = database.exec("PRAGMA table_info(courses)");
    const hasSemester = coursesInfo.length > 0 && 
      coursesInfo[0].values.some((row: any) => row[1] === 'semester');
    
    if (!hasSemester) {
      console.log('Migrating courses table: Adding semester column...');
      
      // Create new table with semester column
      database.exec(`
        CREATE TABLE courses_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL,
          title TEXT NOT NULL,
          credits INTEGER NOT NULL,
          department TEXT,
          description TEXT,
          semester TEXT NOT NULL DEFAULT 'Semester 1',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(code, semester)
        )
      `);
      
      // Copy existing data with explicit semester value
      database.exec(`
        INSERT INTO courses_new (id, code, title, credits, department, description, semester, created_at, updated_at)
        SELECT id, code, title, credits, department, description, 'Semester 1', created_at, updated_at
        FROM courses
      `);
      
      database.exec(`DROP TABLE courses`);
      database.exec(`ALTER TABLE courses_new RENAME TO courses`);
      console.log('Courses table migrated successfully');
    } else {
      // Data fix: Ensure all courses have a valid semester value
      // Fix any courses with timestamp values (from bad migration) or NULL/empty
      console.log('Checking for courses with invalid semester values...');
      database.exec(`
        UPDATE courses 
        SET semester = 'Semester 1' 
        WHERE semester NOT IN ('Semester 1', 'Semester 2')
      `);
      console.log('Courses semester values verified/fixed');
    }
  } catch (error) {
    console.log('Courses migration error:', error);
  }

  // Create instructors table
  database.exec(`
    CREATE TABLE IF NOT EXISTS instructors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create rooms table
  database.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      capacity INTEGER NOT NULL,
      building TEXT,
      equipment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create sections table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create schedules table
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      instructor_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      day TEXT NOT NULL CHECK(day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      available_space INTEGER,
      notes TEXT,
      semester TEXT NOT NULL DEFAULT 'Semester 1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add semester column to existing schedules table if it doesn't exist
  try {
    const schedulesInfo = database.exec("PRAGMA table_info(schedules)");
    const hasSemester = schedulesInfo.length > 0 && 
      schedulesInfo[0].values.some((row: any) => row[1] === 'semester');
    
    if (!hasSemester) {
      console.log('Migrating schedules table: Adding semester column...');
      database.exec(`ALTER TABLE schedules ADD COLUMN semester TEXT NOT NULL DEFAULT 'Semester 1'`);
      // Ensure all existing schedules have semester set to 'Semester 1'
      database.exec(`UPDATE schedules SET semester = 'Semester 1' WHERE semester IS NULL OR semester = ''`);
      console.log('Schedules table migrated successfully');
    } else {
      // Data fix: Ensure all schedules have a valid semester value
      // Fix any schedules with timestamp values (from bad migration) or NULL/empty
      console.log('Checking for schedules with invalid semester values...');
      database.exec(`
        UPDATE schedules 
        SET semester = 'Semester 1' 
        WHERE semester NOT IN ('Semester 1', 'Semester 2')
      `);
      console.log('Schedules semester values verified/fixed');
    }
  } catch (error) {
    console.log('Schedules migration error:', error);
  }

  // Create indexes for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_instructor ON schedules(instructor_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_room ON schedules(room_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_section ON schedules(section_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day);
    CREATE INDEX IF NOT EXISTS idx_schedules_semester ON schedules(semester);
    CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
  `);

  // Create default admin user if no users exist
  const userCountResult = database.exec('SELECT COUNT(*) as count FROM users');
  const userCount = userCountResult[0]?.values[0]?.[0] || 0;
  
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('admin123', 10);
    
    database.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['admin', defaultPassword, 'admin']
    );
    
    console.log('Default admin user created: username=admin, password=admin123');
  }

  // Save database to file
  saveDatabase();

  console.log('Database initialized successfully');
};

export const reloadDatabase = async (): Promise<void> => {
  // Close current database
  if (db) {
    db.close();
    db = null;
  }
  
  // Reinitialize database
  await initDatabase();
};
