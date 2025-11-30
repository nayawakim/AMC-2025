import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('test.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS test_ids (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS scanned_qr_codes (
      id TEXT PRIMARY KEY NOT NULL,
      infected INTEGER NOT NULL,
      scanned_at INTEGER NOT NULL
    );
  `);
};

export const saveId = (id: string): { success: boolean; message: string } => {
  try {
    const existing = db.getFirstSync<{ id: string }>(
      'SELECT id FROM test_ids WHERE id = ?',
      [id]
    );

    if (existing) {
      return { success: false, message: 'ID already exists!' };
    }

    db.runSync(
      'INSERT INTO test_ids (id, created_at) VALUES (?, ?)',
      [id, Date.now()]
    );

    return { success: true, message: 'ID saved successfully!' };
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
};

export const deleteId = (id: string): { success: boolean; message: string } => {
  try {
    const result = db.runSync('DELETE FROM test_ids WHERE id = ?', [id]);

    if (result.changes === 0) {
      return { success: false, message: 'ID not found!' };
    }

    return { success: true, message: 'ID deleted successfully!' };
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
};

export const getAllIds = (): Array<{ id: string; created_at: number }> => {
  try {
    const result = db.getAllSync<{ id: string; created_at: number }>(
      'SELECT * FROM test_ids ORDER BY created_at DESC'
    );
    return result;
  } catch (error) {
    console.error('Error fetching IDs:', error);
    return [];
  }
};

export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

// QR Code related functions
export interface QRCodeData {
  id: string;
  infected: boolean;
  scanned_at: number;
}

export const saveScannedQRCode = (
  id: string,
  infected: boolean
): { success: boolean; message: string } => {
  try {
    const existing = db.getFirstSync<{ id: string }>(
      'SELECT id FROM scanned_qr_codes WHERE id = ?',
      [id]
    );

    if (existing) {
      return { success: false, message: 'QR Code already scanned!' };
    }

    db.runSync(
      'INSERT INTO scanned_qr_codes (id, infected, scanned_at) VALUES (?, ?, ?)',
      [id, infected ? 1 : 0, Date.now()]
    );

    return { success: true, message: 'QR Code scanned and saved successfully!' };
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
};

export const getAllScannedQRCodes = (): QRCodeData[] => {
  try {
    const result = db.getAllSync<{ id: string; infected: number; scanned_at: number }>(
      'SELECT * FROM scanned_qr_codes ORDER BY scanned_at DESC'
    );
    return result.map(item => ({
      id: item.id,
      infected: item.infected === 1,
      scanned_at: item.scanned_at,
    }));
  } catch (error) {
    console.error('Error fetching scanned QR codes:', error);
    return [];
  }
};

export const deleteScannedQRCode = (id: string): { success: boolean; message: string } => {
  try {
    const result = db.runSync('DELETE FROM scanned_qr_codes WHERE id = ?', [id]);

    if (result.changes === 0) {
      return { success: false, message: 'QR Code not found!' };
    }

    return { success: true, message: 'QR Code deleted successfully!' };
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
};
