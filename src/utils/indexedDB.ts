// 创建IndexedDB工具类

export interface SavedTemplate {
  id?: number;
  title: string;
  html: string;
  createdAt: Date;
}

class IndexedDBService {
  private readonly dbName = 'deepsite-templates-db';
  private readonly storeName = 'templates';
  private readonly version = 1;
  private db: IDBDatabase | null = null;

  // 初始化数据库
  public async initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('IndexedDB打开失败:', event);
        reject(false);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('title', 'title', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // 保存模板
  public async saveTemplate(template: SavedTemplate): Promise<number> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(template);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as number);
      };

      request.onerror = (event) => {
        console.error('保存模板失败:', event);
        reject(new Error('保存模板失败'));
      };
    });
  }

  // 获取所有模板
  public async getAllTemplates(): Promise<SavedTemplate[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as SavedTemplate[]);
      };

      request.onerror = (event) => {
        console.error('获取模板列表失败:', event);
        reject(new Error('获取模板列表失败'));
      };
    });
  }

  // 获取单个模板
  public async getTemplate(id: number): Promise<SavedTemplate | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as SavedTemplate || null);
      };

      request.onerror = (event) => {
        console.error('获取模板失败:', event);
        reject(new Error('获取模板失败'));
      };
    });
  }

  // 删除模板
  public async deleteTemplate(id: number): Promise<boolean> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('删除模板失败:', event);
        reject(new Error('删除模板失败'));
      };
    });
  }
}

// 导出单例实例
export const indexedDBService = new IndexedDBService(); 