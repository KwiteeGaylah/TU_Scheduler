import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../database/services/UserService';
import bcrypt from 'bcryptjs';

// Mock database
const mockDb = {
  exec: vi.fn(),
  run: vi.fn(),
  prepare: vi.fn(() => ({
    get: vi.fn(),
    all: vi.fn(),
  })),
};

vi.mock('../../database/init', () => ({
  getDatabase: () => mockDb,
  saveDatabase: vi.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'admin',
        password_hash: hashedPassword,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.prepare().get.mockReturnValue(mockUser);

      const result = await UserService.login('admin', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.username).toBe('admin');
      expect(result.data.password_hash).toBeUndefined(); // Password should not be returned
    });

    it('should fail with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'admin',
        password_hash: hashedPassword,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDb.prepare().get.mockReturnValue(mockUser);

      const result = await UserService.login('admin', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should fail with non-existent username', async () => {
      mockDb.prepare().get.mockReturnValue(undefined);

      const result = await UserService.login('nonexistent', 'password');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should validate required fields', async () => {
      const result = await UserService.login('', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Username and password');
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      mockDb.prepare().get.mockReturnValue(undefined); // Username doesn't exist
      mockDb.run.mockReturnValue({ lastID: 1 });

      const result = await UserService.createUser({
        username: 'newuser',
        password: 'password123',
        role: 'registrar',
      });

      expect(result.success).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should prevent duplicate usernames', async () => {
      mockDb.prepare().get.mockReturnValue({ id: 1, username: 'existinguser' });

      const result = await UserService.createUser({
        username: 'existinguser',
        password: 'password123',
        role: 'registrar',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    it('should validate role', async () => {
      const result = await UserService.createUser({
        username: 'newuser',
        password: 'password123',
        role: 'invalidrole' as any,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('role');
    });

    it('should enforce minimum password length', async () => {
      const result = await UserService.createUser({
        username: 'newuser',
        password: '123',
        role: 'registrar',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 6 characters');
    });
  });

  describe('updateUser', () => {
    it('should update password successfully', async () => {
      const result = await UserService.updateUser(1, {
        password: 'newpassword123',
      });

      expect(result.success).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should update username successfully', async () => {
      mockDb.prepare().get.mockReturnValue(undefined); // Username available

      const result = await UserService.updateUser(1, {
        username: 'newusername',
      });

      expect(result.success).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should prevent updating to existing username', async () => {
      mockDb.prepare().get.mockReturnValue({ id: 2, username: 'existinguser' });

      const result = await UserService.updateUser(1, {
        username: 'existinguser',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already taken');
    });
  });
});
