// User types
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'registrar' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  username: string;
  password: string;
  role: 'admin' | 'registrar' | 'viewer';
}

export interface UserUpdateInput {
  username?: string;
  password?: string;
  role?: 'admin' | 'registrar' | 'viewer';
}

// Course types
export interface Course {
  id: number;
  code: string;
  title: string;
  credits: number;
  department?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCreateInput {
  code: string;
  title: string;
  credits: number;
  department?: string;
  description?: string;
}

export interface CourseUpdateInput {
  code?: string;
  title?: string;
  credits?: number;
  department?: string;
  description?: string;
}

// Instructor types
export interface Instructor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorCreateInput {
  name: string;
  email?: string;
  phone?: string;
  department?: string;
}

export interface InstructorUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
}

// Room types
export interface Room {
  id: number;
  name: string;
  capacity: number;
  building?: string;
  equipment?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomCreateInput {
  name: string;
  capacity: number;
  building?: string;
  equipment?: string;
}

export interface RoomUpdateInput {
  name?: string;
  capacity?: number;
  building?: string;
  equipment?: string;
}

// Section types
export interface Section {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SectionCreateInput {
  name: string;
  description?: string;
}

export interface SectionUpdateInput {
  name?: string;
  description?: string;
}

// Schedule types
export interface Schedule {
  id: number;
  course_id: number;
  instructor_id: number;
  room_id: number;
  section_id: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;
  end_time: string;
  available_space?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleWithDetails extends Schedule {
  course_code?: string;
  course_title?: string;
  course_credits?: number;
  instructor_name?: string;
  room_name?: string;
  room_capacity?: number;
  section_name?: string;
}

export interface ScheduleCreateInput {
  course_id: number;
  instructor_id: number;
  room_id: number;
  section_id: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;
  end_time: string;
  available_space?: number;
  notes?: string;
}

export interface ScheduleUpdateInput {
  course_id?: number;
  instructor_id?: number;
  room_id?: number;
  section_id?: number;
  day?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time?: string;
  end_time?: string;
  available_space?: number;
  notes?: string;
}

// Conflict types
export interface Conflict {
  conflict_type: 'Instructor' | 'Room' | 'Section' | 'Duplicate Time Slot';
  resource_name: string;
  id: number;
  course_id: number;
  instructor_id: number;
  room_id: number;
  section_id: number;
  day: string;
  start_time: string;
  end_time: string;
  available_space?: number;
  notes?: string;
}

// Filter types
export interface ScheduleFilters {
  course_id?: number;
  instructor_id?: number;
  room_id?: number;
  section_id?: number;
  day?: string;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
