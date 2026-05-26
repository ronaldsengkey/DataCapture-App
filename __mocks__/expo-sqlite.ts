class FakeStatement {
  executeSync = (_values?: any[]) => {};
  finalizeSync = () => {};
}

class FakeDatabase {
  private memory: any[] = [];
  execSync = (_sql: string) => {};
  prepareSync = (_sql: string) => {
    return {
      executeSync: (values?: any[]) => {
        // very small subset for tests: INSERT OR REPLACE + SELECT ... WHERE expiresAt > ?
        if (typeof _sql === 'string') {
          const upper = _sql.toUpperCase();
          if (upper.includes('INSERT OR REPLACE')) {
            const [id, type, createdAt, expiresAt, content] = values || [];
            const idx = this.memory.findIndex((x) => x.id === id);
            const row = { id, type, createdAt, expiresAt, content };
            if (idx >= 0) this.memory[idx] = row;
            else this.memory.push(row);
            return [];
          }
          if (upper.includes('SELECT') && upper.includes('WHERE EXPIRESAT >')) {
            const [now] = values || [];
            return this.memory
              .filter((x) => x.expiresAt > now)
              .sort((a, b) => b.createdAt - a.createdAt);
          }
          if (upper.includes('DELETE FROM')) {
            const [id] = values || [];
            this.memory = this.memory.filter((x) => x.id !== id);
            return [];
          }
        }
        return [];
      },
      finalizeSync: () => {},
    };
  };
}

const openDatabaseSync = (_name: string) => new FakeDatabase();

export { openDatabaseSync };

export default {
  openDatabaseSync,
};

