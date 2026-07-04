/**
 * Database module for Accounting Software
 * Utilizes IndexedDB for local persistent storage of clients and bills.
 */

const DB_NAME = 'AccountingSoftwareDB';
const DB_VERSION = 1;
let dbInstance = null;

function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database failed to open:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log('Database opened successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('Upgrading database schema...');

      // Create Clients Store
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        clientStore.createIndex('name', 'name', { unique: false });
        clientStore.createIndex('email', 'email', { unique: true });
        console.log('Created clients object store');
      }

      // Create Bills Store
      if (!db.objectStoreNames.contains('bills')) {
        const billStore = db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
        billStore.createIndex('clientId', 'clientId', { unique: false });
        billStore.createIndex('date', 'date', { unique: false });
        billStore.createIndex('billType', 'billType', { unique: false });
        console.log('Created bills object store');
      }
    };
  });
}

// Helper to get an object store in a transaction
async function getStore(storeName, mode = 'readonly') {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

const db = {
  /**
   * Client Operations
   */
  clients: {
    async add(client) {
      const store = await getStore('clients', 'readwrite');
      return new Promise((resolve, reject) => {
        // Clean fields
        const record = {
          name: client.name || '',
          companyName: client.companyName || '',
          email: client.email || '',
          phone: client.phone || '',
          gstin: client.gstin || '',
          address: client.address || '',
          createdAt: new Date().toISOString()
        };
        const request = store.add(record);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getAll() {
      const store = await getStore('clients', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async get(id) {
      const store = await getStore('clients', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(Number(id));
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async update(client) {
      const store = await getStore('clients', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(client);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async delete(id) {
      const store = await getStore('clients', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(Number(id));
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    }
  },

  /**
   * Bill Operations
   */
  bills: {
    async add(bill) {
      const store = await getStore('bills', 'readwrite');
      return new Promise((resolve, reject) => {
        const record = {
          clientId: Number(bill.clientId),
          billNumber: bill.billNumber || '',
          date: bill.date || new Date().toISOString().split('T')[0],
          billType: bill.billType || 'with-gst', // 'with-gst' or 'without-gst'
          items: bill.items || [], // Array of { name, price, qty, gstRate, gstAmount, total }
          discount: Number(bill.discount) || 0,
          subtotal: Number(bill.subtotal) || 0,
          totalGst: Number(bill.totalGst) || 0,
          totalAmount: Number(bill.totalAmount) || 0,
          fileData: bill.fileData || null, // Base64 receipt data / image url
          fileName: bill.fileName || '',
          createdAt: new Date().toISOString()
        };
        const request = store.add(record);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getAll() {
      const store = await getStore('bills', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async get(id) {
      const store = await getStore('bills', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(Number(id));
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getByClientId(clientId) {
      const store = await getStore('bills', 'readonly');
      const index = store.index('clientId');
      return new Promise((resolve, reject) => {
        const request = index.getAll(Number(clientId));
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async delete(id) {
      const store = await getStore('bills', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(Number(id));
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    }
  }
};

// Export to window object for script tagging ease
window.db = db;
