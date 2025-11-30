import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('test.db');

export const initDatabase = () => {
  // Drop old tables if they exist (migration from old schema)
  try {
    db.execSync('DROP TABLE IF EXISTS test_ids;');
    db.execSync('DROP TABLE IF EXISTS scanned_qr_codes;');
  } catch (error) {
    console.log('Error dropping old tables:', error);
  }

  // Create the new users table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      infected INTEGER NOT NULL DEFAULT 0
    );
  `);
};

export const getUserId = (): string | null => {
  try {
    const user = db.getFirstSync<{ id: string }>(
      'SELECT id FROM users LIMIT 1'
    );
    return user ? user.id : null;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
};

export const addUser = (id: string): { success: boolean; message: string } => {
  try {
    // First, check if a user already exists
    const existingUser = getUserId();

    if (existingUser) {
      // Delete the existing user first (only one user allowed)
      db.runSync('DELETE FROM users');
    }

    // Insert the new user
    db.runSync(
      'INSERT INTO users (id, infected) VALUES (?, ?)',
      [id, 0]
    );

    return { success: true, message: 'User added successfully!' };
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
};

export const deleteUser = (): { success: boolean; message: string } => {
  try {
    const result = db.runSync('DELETE FROM users');

    if (result.changes === 0) {
      return { success: false, message: 'No user found!' };
    }

    return { success: true, message: 'User deleted successfully!' };
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
};
