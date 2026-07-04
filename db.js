/**
 * Database module for Accounting & Production Software
 * Utilizes IndexedDB for local persistent storage.
 */

const DB_NAME = 'AccountingSoftwareDB';
const DB_VERSION = 2; // Upgraded to v2 to support production/stitching records
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
      console.log('Upgrading database schema to version ' + DB_VERSION);

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

      // Create Employees Store
      if (!db.objectStoreNames.contains('employees')) {
        const employeeStore = db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
        employeeStore.createIndex('name', 'name', { unique: false });
        employeeStore.createIndex('role', 'role', { unique: false });
        console.log('Created employees object store');
      }

      // Create Fabrics Store
      if (!db.objectStoreNames.contains('fabrics')) {
        const fabricStore = db.createObjectStore('fabrics', { keyPath: 'id', autoIncrement: true });
        fabricStore.createIndex('fabricType', 'fabricType', { unique: false });
        fabricStore.createIndex('status', 'status', { unique: false });
        console.log('Created fabrics object store');
      }

      // Create Stitching Assignments Store
      if (!db.objectStoreNames.contains('stitching')) {
        const stitchingStore = db.createObjectStore('stitching', { keyPath: 'id', autoIncrement: true });
        stitchingStore.createIndex('employeeId', 'employeeId', { unique: false });
        stitchingStore.createIndex('fabricId', 'fabricId', { unique: false });
        stitchingStore.createIndex('status', 'status', { unique: false });
        console.log('Created stitching object store');
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
          billType: bill.billType || 'with-gst',
          items: bill.items || [],
          discount: Number(bill.discount) || 0,
          subtotal: Number(bill.subtotal) || 0,
          totalGst: Number(bill.totalGst) || 0,
          totalAmount: Number(bill.totalAmount) || 0,
          fileData: bill.fileData || null,
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
  },

  /**
   * Employee Operations
   */
  employees: {
    async add(emp) {
      const store = await getStore('employees', 'readwrite');
      return new Promise((resolve, reject) => {
        const record = {
          name: emp.name || '',
          phone: emp.phone || '',
          role: emp.role || 'Stitcher',
          stitchRate: Number(emp.stitchRate) || 0, // ₹ paid per piece stitched
          salary: Number(emp.salary) || 0,
          createdAt: new Date().toISOString()
        };
        const request = store.add(record);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getAll() {
      const store = await getStore('employees', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async get(id) {
      const store = await getStore('employees', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(Number(id));
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async update(emp) {
      const store = await getStore('employees', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(emp);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async delete(id) {
      const store = await getStore('employees', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(Number(id));
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    }
  },

  /**
   * Fabric Operations
   */
  fabrics: {
    async add(fab) {
      const store = await getStore('fabrics', 'readwrite');
      return new Promise((resolve, reject) => {
        const record = {
          fabricType: fab.fabricType || '',
          quantityReceived: Number(fab.quantityReceived) || 0, // in meters
          color: fab.color || '',
          receivedDate: fab.receivedDate || new Date().toISOString().split('T')[0],
          supplier: fab.supplier || '',
          status: fab.status || 'Stored', // Stored / Stitching / Completed
          createdAt: new Date().toISOString()
        };
        const request = store.add(record);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getAll() {
      const store = await getStore('fabrics', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async get(id) {
      const store = await getStore('fabrics', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(Number(id));
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async update(fab) {
      const store = await getStore('fabrics', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(fab);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async delete(id) {
      const store = await getStore('fabrics', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(Number(id));
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    }
  },

  /**
   * Stitching Assignment Operations
   */
  stitching: {
    async add(stitch) {
      const store = await getStore('stitching', 'readwrite');
      return new Promise((resolve, reject) => {
        const record = {
          employeeId: Number(stitch.employeeId),
          fabricId: Number(stitch.fabricId),
          piecesStitched: Number(stitch.piecesStitched) || 0,
          ratePerPiece: Number(stitch.ratePerPiece) || 0,
          totalPayment: Number(stitch.totalPayment) || 0,
          assignedDate: stitch.assignedDate || new Date().toISOString().split('T')[0],
          status: stitch.status || 'Stitching', // Stitching / Finished
          notes: stitch.notes || '',
          createdAt: new Date().toISOString()
        };
        const request = store.add(record);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getAll() {
      const store = await getStore('stitching', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async getByEmployeeId(empId) {
      const store = await getStore('stitching', 'readonly');
      const index = store.index('employeeId');
      return new Promise((resolve, reject) => {
        const request = index.getAll(Number(empId));
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async update(stitch) {
      const store = await getStore('stitching', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(stitch);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async delete(id) {
      const store = await getStore('stitching', 'readwrite');
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
