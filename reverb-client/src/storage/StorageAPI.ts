interface StorageAPI {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, data: T): Promise<void>;
}

class OPFSStorage implements StorageAPI {
  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory();
  }

  private getFileName(key: string): string {
    return `${key}.json`;
  }

  async read<T>(key: string): Promise<T | null> {
    try {
      const root = await this.getRoot();
      const fileName = this.getFileName(key);
      console.log("fileName", fileName);

      try {
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
      } catch (error) {
        // If file doesn't exist, return null instead of throwing
        if (error instanceof Error && error.name === "NotFoundError") {
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error(`Failed to read ${key} from OPFS:`, error);
      return null;
    }
  }

  async write<T>(key: string, data: T): Promise<void> {
    try {
      const root = await this.getRoot();
      const fileName = this.getFileName(key);
      const fileHandle = await root.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2)); // Pretty print JSON
      await writable.close();
    } catch (error) {
      console.error(`Failed to write ${key} to OPFS:`, error);
      throw error;
    }
  }
}

class IndexedDBStorage implements StorageAPI {
  private readonly dbName = "patient_lists_db";
  private readonly storeName = "patient_lists_store";
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async read<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error(`Failed to read ${key} from IndexedDB:`, error);
      return null;
    }
  }

  async write<T>(key: string, data: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error(`Failed to write ${key} to IndexedDB:`, error);
      throw error;
    }
  }
}

async function isOPFSSupported(): Promise<boolean> {
  try {
    // Check if basic OPFS API is available
    if (!navigator.storage?.getDirectory) {
      return false;
    }

    // Test if createWritable is supported by creating a test file
    const root = await navigator.storage.getDirectory();
    const testFileHandle = await root.getFileHandle("__test__", {
      create: true,
    });
    const hasCreateWritable = "createWritable" in testFileHandle;

    // Clean up test file
    await root.removeEntry("__test__");

    return hasCreateWritable;
  } catch {
    return false;
  }
}

export async function createStorage(): Promise<StorageAPI> {
  return (await isOPFSSupported()) ? new OPFSStorage() : new IndexedDBStorage();
}

// Export a singleton instance
let storageInstance: StorageAPI | null = null;

export async function getStorage(): Promise<StorageAPI> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}
