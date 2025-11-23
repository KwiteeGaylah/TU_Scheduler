"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.saveDatabase = exports.closeDatabase = exports.getDatabase = void 0;
const sql_js_1 = __importDefault(require("sql.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const constants_1 = require("../shared/constants");
let db = null;
let dbPath;
const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};
exports.getDatabase = getDatabase;
const closeDatabase = () => {
    if (db) {
        // Save database to file before closing
        const data = db.export();
        fs_1.default.writeFileSync(dbPath, Buffer.from(data));
        db.close();
        db = null;
    }
};
exports.closeDatabase = closeDatabase;
// Helper to save database periodically
const saveDatabase = () => {
    if (db && dbPath) {
        const data = db.export();
        fs_1.default.writeFileSync(dbPath, Buffer.from(data));
    }
};
exports.saveDatabase = saveDatabase;
const initDatabase = async () => {
    const SQL = await (0, sql_js_1.default)({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
    });
    const userDataPath = electron_1.app.getPath('userData');
    dbPath = path_1.default.join(userDataPath, constants_1.DB_NAME);
    // Ensure directory exists
    if (!fs_1.default.existsSync(userDataPath)) {
        fs_1.default.mkdirSync(userDataPath, { recursive: true });
    }
    // Load existing database or create new one
    if (fs_1.default.existsSync(dbPath)) {
        const buffer = fs_1.default.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    }
    else {
        db = new SQL.Database();
    }
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
    // Create courses table
    database.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      credits INTEGER NOT NULL,
      department TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    )
  `);
    // Create indexes for better query performance
    database.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_instructor ON schedules(instructor_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_room ON schedules(room_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_section ON schedules(section_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day);
  `);
    // Create default admin user if no users exist
    const userCountResult = database.exec('SELECT COUNT(*) as count FROM users');
    const userCount = userCountResult[0]?.values[0]?.[0] || 0;
    if (userCount === 0) {
        const bcrypt = require('bcryptjs');
        const defaultPassword = await bcrypt.hash('admin123', 10);
        database.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', defaultPassword, 'admin']);
        console.log('Default admin user created: username=admin, password=admin123');
    }
    // Save database to file
    (0, exports.saveDatabase)();
    console.log('Database initialized successfully');
};
exports.initDatabase = initDatabase;
