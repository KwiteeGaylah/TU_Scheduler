"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_NAME = exports.CONFLICT_TYPES = exports.TIME_SLOTS = exports.USER_ROLES = exports.DAYS_OF_WEEK = void 0;
exports.DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
exports.USER_ROLES = {
    ADMIN: 'admin',
    REGISTRAR: 'registrar',
    VIEWER: 'viewer',
};
exports.TIME_SLOTS = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
];
exports.CONFLICT_TYPES = {
    INSTRUCTOR: 'instructor',
    ROOM: 'room',
    SECTION: 'section',
    CAPACITY: 'capacity',
};
exports.DB_NAME = 'tu_scheduler.db';
