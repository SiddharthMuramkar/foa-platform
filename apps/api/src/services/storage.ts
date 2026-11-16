import fs from 'fs';
import path from 'path';

export interface StorageAdapter {
  saveFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  getPublicUrl(fileKey: string): string;
}

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const ext = path.extname(fileName) || '.jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(this.baseDir, uniqueName);
    await fs.promises.writeFile(filePath, fileBuffer);
    return `/uploads/${uniqueName}`;
  }

  getPublicUrl(fileKey: string): string {
    return fileKey;
  }
}

export const storageService = new LocalStorageAdapter();
