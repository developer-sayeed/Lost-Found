import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { LostItem, StaffMember, HotelSettings, User, AuditLog, AppNotification, Certificate } from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const CONFIG_FILE = path.join(DATA_DIR, 'mongodb_config.json');

export interface MongoStatusInfo {
  connected: boolean;
  connecting: boolean;
  databaseName: string;
  host: string;
  source: 'mongodb' | 'local_json_fallback';
  uriConfigured: boolean;
  maskedUri: string;
  error?: string;
  lastConnectedAt?: string;
  pingMs?: number;
  collections: {
    itemsCount: number;
    staffCount: number;
    usersCount: number;
    auditLogsCount: number;
    settingsCount: number;
    categoriesCount?: number;
    sessionsCount?: number;
  };
}

// Safely remove MongoDB _id property completely so driver never assigns or serializes _id: null
function stripMongoId<T>(obj: T): Omit<T, '_id'> {
  if (!obj || typeof obj !== 'object') return obj as any;
  const copy: any = { ...obj };
  delete copy._id;
  return copy;
}

class MongoService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private isConnecting = false;
  private currentUri = process.env.MONGODB_URI || 'mongodb+srv://mdriday256:587710@cluster0.pfjdgng.mongodb.net/';
  private currentDbName = process.env.MONGODB_DB_NAME || 'hotel';
  private lastConnectedAt: string | undefined = undefined;
  private lastError: string | undefined = undefined;
  private lastPingMs: number | undefined = undefined;

  constructor() {
    this.loadSavedConfig();
  }

  private loadSavedConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        if (configData.uri && !process.env.MONGODB_URI) {
          this.currentUri = configData.uri;
        }
        if (configData.dbName && !process.env.MONGODB_DB_NAME) {
          this.currentDbName = configData.dbName;
        }
      }
    } catch (e) {
      console.warn('Could not read mongodb_config.json:', e);
    }
  }

  private saveConfig(uri: string, dbName: string) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify({ uri, dbName, updatedAt: new Date().toISOString() }, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('Could not save mongodb_config.json:', e);
    }
  }

  public getMaskedUri(uri: string): string {
    if (!uri) return '';
    try {
      // Mask password if standard mongodb / mongodb+srv URI
      return uri.replace(/:([^:@]+)@/, ':••••••••@');
    } catch {
      return 'mongodb://••••••••';
    }
  }

  public async init() {
    if (this.currentUri) {
      console.log(`[MongoDB] Initializing connection to MongoDB database "${this.currentDbName}"...`);
      await this.connect(this.currentUri, this.currentDbName).catch(err => {
        console.warn(`[MongoDB] Auto-connect on startup failed: ${err.message}. Running on local persistence fallback.`);
      });
    } else {
      console.log('[MongoDB] No MONGODB_URI configured. Running in Local Storage Mode (can connect via Settings anytime).');
    }
  }

  public async connect(uri: string, dbName = 'hotel'): Promise<MongoStatusInfo> {
    if (this.isConnecting) {
      throw new Error('Connection attempt already in progress');
    }

    this.isConnecting = true;
    this.lastError = undefined;

    try {
      if (this.client) {
        try {
          await this.client.close();
        } catch {
          // ignore
        }
      }

      console.log(`[MongoDB] Connecting to ${this.getMaskedUri(uri)} [Database: ${dbName}]...`);
      const startTime = Date.now();

      const client = new MongoClient(uri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10
      });

      // Defensive connection event listeners
      client.on('close', () => {
        if (this.isConnected) {
          console.warn('[MongoDB] MongoClient closed. Seamlessly reverting to local database.');
        }
        this.isConnected = false;
        this.db = null;
      });
      client.on('serverClosed', () => {
        this.isConnected = false;
        this.db = null;
      });
      client.on('topologyClosed', () => {
        this.isConnected = false;
        this.db = null;
      });
      client.on('error', (err: any) => {
        this.handleConnectionError(err);
      });

      await client.connect();
      const database = client.db(dbName);
      
      // Ping database to verify connection
      await database.command({ ping: 1 });
      this.lastPingMs = Date.now() - startTime;

      this.client = client;
      this.db = database;
      this.isConnected = true;
      this.currentUri = uri;
      this.currentDbName = dbName;
      this.lastConnectedAt = new Date().toISOString();
      this.isConnecting = false;

      this.saveConfig(uri, dbName);

      // Create indexes in background
      this.ensureIndexes().catch(err => {
        console.warn('[MongoDB] Index creation notice:', err.message);
      });

      console.log(`[MongoDB] Successfully connected to MongoDB "${dbName}" (${this.lastPingMs}ms ping)!`);
      return await this.getStatus();
    } catch (err: any) {
      this.isConnected = false;
      this.isConnecting = false;
      this.lastError = err.message || 'Failed to connect to MongoDB';
      console.error('[MongoDB] Connection error:', err.message);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (e) {
        console.error('Error closing MongoDB client:', e);
      }
      this.client = null;
      this.db = null;
      this.isConnected = false;
    }
    this.currentUri = '';
    this.saveConfig('', this.currentDbName);
    console.log('[MongoDB] Disconnected from MongoDB. Reverted to Local Storage.');
  }

  public async ping(): Promise<{ ok: boolean; pingMs: number }> {
    if (!this.isConnected || !this.db) {
      throw new Error('Not connected to MongoDB');
    }
    const start = Date.now();
    await this.db.command({ ping: 1 });
    const pingMs = Date.now() - start;
    this.lastPingMs = pingMs;
    return { ok: true, pingMs };
  }

  private async ensureIndexes() {
    if (!this.db) return;
    try {
      // Clean up and repair any legacy documents corrupted with _id: null
      await this.repairNullIdDocuments();

      const itemsCol = this.db.collection<LostItem>('items');
      await itemsCol.createIndex({ code: 1 }, { sparse: true });
      await itemsCol.createIndex({ status: 1 });
      await itemsCol.createIndex({ dateFound: -1 });
      await itemsCol.createIndex({ category: 1 });
      await itemsCol.createIndex({ storeLocation: 1 });

      const staffCol = this.db.collection<StaffMember>('staff_members');
      await staffCol.createIndex({ userId: 1 }, { unique: true, sparse: true });
      await staffCol.createIndex({ email: 1 });

      const usersCol = this.db.collection<User>('users');
      await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true });

      const certsCol = this.db.collection('certificates');
      await certsCol.createIndex({ id: 1 }, { unique: true, sparse: true });
      await certsCol.createIndex({ certificateNumber: 1 }, { sparse: true });
    } catch (err) {
      console.warn('[MongoDB] Index creation:', err);
    }
  }

  // Scans collections and repairs any legacy document that has _id: null causing E11000 duplicate key errors
  public async repairNullIdDocuments(): Promise<void> {
    if (!this.db) return;
    const collections = ['certificates', 'items', 'staff_members', 'users', 'hotel_settings', 'audit_logs', 'notifications'];
    for (const colName of collections) {
      try {
        const col = this.db.collection(colName);
        const nullDoc = await col.findOne({ _id: null });
        if (nullDoc) {
          console.warn(`[MongoDB] Found document with _id: null in "${colName}". Purging and repairing with valid ObjectId...`);
          const repaired = { ...nullDoc };
          delete (repaired as any)._id;
          await col.deleteOne({ _id: null });
          if (repaired.id || repaired.email || repaired.code || Object.keys(repaired).length > 0) {
            await col.insertOne(repaired);
            console.log(`[MongoDB] Successfully repaired document in "${colName}".`);
          }
        }
      } catch (err: any) {
        console.warn(`[MongoDB] Notice checking _id: null in "${colName}":`, err?.message);
      }
    }
  }

  public async getStatus(): Promise<MongoStatusInfo> {
    let itemsCount = 0;
    let staffCount = 0;
    let usersCount = 0;
    let auditLogsCount = 0;
    let settingsCount = 0;
    let categoriesCount = 0;
    let sessionsCount = 0;
    let host = 'Local File System';

    if (this.isConnected && this.db) {
      try {
        // Count from 'items' collection primarily, fallback to 'lost_items' if needed
        const itemsCol = this.db.collection('items');
        itemsCount = await itemsCol.countDocuments();
        if (itemsCount === 0) {
          const lostItemsCol = this.db.collection('lost_items');
          const altCount = await lostItemsCol.countDocuments();
          if (altCount > 0) itemsCount = altCount;
        }

        staffCount = await this.db.collection('staff_members').countDocuments();
        usersCount = await this.db.collection('users').countDocuments();
        auditLogsCount = await this.db.collection('audit_logs').countDocuments();
        settingsCount = await this.db.collection('hotel_settings').countDocuments();
        
        try {
          categoriesCount = await this.db.collection('categories').countDocuments();
        } catch {
          categoriesCount = 0;
        }

        try {
          sessionsCount = await this.db.collection('active_sessions').countDocuments();
        } catch {
          sessionsCount = 0;
        }

        // Parse host from URI
        const match = this.currentUri.match(/@([^/?]+)/);
        host = match ? match[1] : 'MongoDB Server';
      } catch (e: any) {
        this.lastError = e.message;
      }
    }

    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      databaseName: this.currentDbName,
      host,
      source: this.isConnected ? 'mongodb' : 'local_json_fallback',
      uriConfigured: Boolean(this.currentUri),
      maskedUri: this.getMaskedUri(this.currentUri),
      error: this.lastError,
      lastConnectedAt: this.lastConnectedAt,
      pingMs: this.lastPingMs,
      collections: {
        itemsCount,
        staffCount,
        usersCount,
        auditLogsCount,
        settingsCount,
        categoriesCount,
        sessionsCount
      }
    };
  }

  public getDb(): Db | null {
    return this.isConnected ? this.db : null;
  }

  public get isLive(): boolean {
    return Boolean(this.isConnected && this.db !== null && this.client !== null);
  }

  /**
   * Catches and inspects connection-related errors from MongoDB drivers.
   * If a connection drop occurs, marks isConnected = false and db = null so the
   * system immediately and cleanly falls back to local storage without repeating errors.
   */
  public handleConnectionError(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || err.toString() || '');
    const errName = String(err.name || '');
    const isConnErr =
      errName === 'MongoNotConnectedError' ||
      errName === 'MongoServerSelectionError' ||
      errName === 'MongoTopologyClosedError' ||
      errName === 'MongoNetworkTimeoutError' ||
      errName === 'MongoNetworkError' ||
      msg.includes('Client must be connected') ||
      msg.includes('topology was closed') ||
      msg.includes('connection timed out') ||
      msg.includes('connection closed') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNREFUSED');

    if (isConnErr) {
      if (this.isConnected) {
        console.warn(`[MongoDB] Connection lost (${msg || errName}). Reverting to local JSON database.`);
      }
      this.isConnected = false;
      this.db = null;
      this.lastError = msg || 'MongoDB connection lost';
      return true;
    }
    return false;
  }

  // Helper to normalize any item document retrieved directly from MongoDB
  private normalizeItem(doc: any): LostItem {
    if (!doc) return {} as LostItem;
    const rawId = doc.id || (doc._id ? doc._id.toString() : `item-${Date.now()}`);
    const rawCode = doc.code || doc.itemCode || doc.item_code || `LF-${rawId.replace(/^item-/, '')}`;
    const rawDate = doc.dateFound || doc.date_found || doc.date || (doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : '');

    // Real Item Name from MongoDB document
    const itemName = (
      doc.itemName ||
      doc.item_name ||
      doc.item ||
      doc.name ||
      doc.title ||
      doc.itemTitle ||
      doc.objectName ||
      doc.product ||
      doc.productName ||
      'Found Item'
    ).toString().trim();

    // Real Room Number
    const roomNumber = String(doc.roomNumber || doc.room_number || doc.room || doc.roomNo || doc.room_no || '').trim();

    // Real Description
    const description = (
      doc.description ||
      doc.itemDescription ||
      doc.item_description ||
      doc.desc ||
      doc.details ||
      doc.notes ||
      doc.remarks ||
      doc.comment ||
      ''
    ).toString();

    // Real Employee / Finder Name
    const employeeName = (
      doc.employeeName ||
      doc.employee_name ||
      doc.foundBy ||
      doc.found_by ||
      doc.finder ||
      doc.staff ||
      doc.staffName ||
      doc.reportedBy ||
      doc.recordedBy ||
      doc.finderName ||
      'Staff'
    ).toString().trim();

    // Real Guest Name
    const guestName = (
      doc.guestName ||
      doc.guest_name ||
      doc.guest ||
      doc.customer ||
      doc.customerName ||
      doc.clientName ||
      ''
    ).toString().trim();

    // Real Location Found
    const locationFound = (
      doc.locationFound ||
      doc.foundLocation ||
      doc.found_location ||
      doc.location ||
      doc.place ||
      (roomNumber ? `Room ${roomNumber}` : 'Hotel Premises')
    ).toString().trim();

    // Status normalization
    let status = doc.status || 'Stored';
    if (typeof status === 'string') {
      const lower = status.toLowerCase().trim();
      if (lower === 'stored' || lower === 'store') status = 'Stored';
      else if (lower === 'handed over' || lower === 'handed_over' || lower === 'handover' || lower === 'delivered' || lower === 'returned') status = 'Handed Over';
      else if (lower === 'dispatched' || lower === 'dispatch' || lower === 'courier' || lower === 'shipped') status = 'Dispatched';
      else if (lower === 'pending claim' || lower === 'pending_claim' || lower === 'claim') status = 'Pending Claim';
      else if (lower === 'under review' || lower === 'under_review' || lower === 'review') status = 'Under Review';
      else if (lower === 'unclaimed') status = 'Unclaimed';
      else if (lower === 'donated') status = 'Donated';
      else if (lower === 'disposed') status = 'Disposed';
      else if (lower === 'pending approval' || lower === 'pending_approval' || lower === 'pending') status = 'Pending Approval';
    }

    const createdAt = doc.createdAt || new Date().toISOString();
    const updatedAt = doc.updatedAt || doc.createdAt || new Date().toISOString();
    const recordedBy = doc.recordedBy || doc.recorded_by || doc.createdBy || employeeName || 'MD ABU SAYEED RIDAY';

    return {
      id: String(rawId),
      code: String(rawCode),
      itemName,
      category: doc.category || 'Other',
      description,
      brand: doc.brand || '',
      color: doc.color || doc.primaryColor || '',
      dateFound: rawDate || new Date().toISOString().split('T')[0],
      timeFound: doc.timeFound || doc.time_found || doc.time || '',
      locationFound,
      roomNumber,
      guestName,
      employeeName,
      storeLocation: doc.storeLocation || doc.store_location || doc.store || doc.storage || 'HK Office',
      dispatchDurationDays: Number(doc.dispatchDurationDays || doc.durationDays || 90),
      dispatchDeadline: doc.dispatchDeadline || doc.deadline || '',
      status,
      recordedBy,
      imageUrl: doc.imageUrl || (Array.isArray(doc.photos) && doc.photos[0]) || doc.image || '',
      createdAt,
      updatedAt,
      isApproved: doc.isApproved !== undefined ? Boolean(doc.isApproved) : (status === 'Pending Approval' ? false : true),
      approvalStatus: doc.approvalStatus || (status === 'Pending Approval' ? 'pending' : 'approved'),
      approvedBy: doc.approvedBy || doc.approved_by || undefined,
      approvedAt: doc.approvedAt || doc.approved_at || undefined,
      submittedByStaffId: doc.submittedByStaffId || doc.submitted_by_staff_id || undefined,
      submittedByStaffName: doc.submittedByStaffName || doc.submitted_by_staff_name || undefined,
      rejectionReason: doc.rejectionReason || doc.rejection_reason || undefined,
      isDeleted: Boolean(doc.isDeleted),
      deletedAt: doc.deletedAt || undefined,
      deletedBy: doc.deletedBy || undefined,
      deletedByRole: doc.deletedByRole || undefined,
      deletionReason: doc.deletionReason || undefined,
      handoverDetails: doc.handoverDetails || doc.handover_details || undefined,
      dispatchDetails: doc.dispatchDetails || doc.dispatch_details || undefined,
      timeline: Array.isArray(doc.timeline) && doc.timeline.length > 0 ? doc.timeline : [
        {
          id: `tl-${rawId}`,
          action: 'Registered in System',
          performedBy: recordedBy || employeeName || 'Staff',
          timestamp: createdAt,
          notes: `Item registered in ${locationFound} by ${employeeName}`
        }
      ]
    };
  }

  // Repair and re-synchronize all items in MongoDB with authentic field mappings
  public async repairAndRestoreAllItemFields(): Promise<{ updatedCount: number; totalCount: number }> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('items');
    const allDocs = await col.find({}).toArray();
    let updatedCount = 0;

    for (const rawDoc of allDocs) {
      const normalized = this.normalizeItem(rawDoc);
      // update document in MongoDB with complete restored fields
      await col.updateOne(
        { _id: rawDoc._id },
        {
          $set: {
            itemName: normalized.itemName,
            description: normalized.description,
            employeeName: normalized.employeeName,
            guestName: normalized.guestName,
            roomNumber: normalized.roomNumber,
            locationFound: normalized.locationFound,
            category: normalized.category,
            brand: normalized.brand,
            color: normalized.color,
            storeLocation: normalized.storeLocation,
            status: normalized.status,
            dateFound: normalized.dateFound,
            timeFound: normalized.timeFound,
            recordedBy: normalized.recordedBy,
            timeline: normalized.timeline,
            updatedAt: new Date().toISOString()
          }
        }
      );
      updatedCount++;
    }

    return { updatedCount, totalCount: allDocs.length };
  }

  // ==========================================
  // SEED / SYNC DATA TO MONGODB
  // ==========================================
  public async seedAllData(data: {
    items: LostItem[];
    staff: StaffMember[];
    users: User[];
    settings: HotelSettings;
    auditLogs: AuditLog[];
  }) {
    if (!this.isConnected || !this.db) {
      throw new Error('Cannot seed: MongoDB is not connected.');
    }

    console.log('[MongoDB] Migrating and syncing data to MongoDB collections (items, staff_members, hotel_settings, audit_logs)...');

    // 1. Items (stored in collection 'items')
    const itemsCol = this.db.collection('items');
    await itemsCol.deleteMany({});
    if (data.items.length > 0) {
      await itemsCol.insertMany(data.items.map(item => stripMongoId(item)));
    }

    // Clean up legacy collection if present
    try {
      await this.db.collection('lost_items').deleteMany({});
    } catch (e) {}

    // 2. Staff
    const staffCol = this.db.collection('staff_members');
    if (data.staff.length > 0) {
      await staffCol.deleteMany({});
      await staffCol.insertMany(data.staff.map(s => stripMongoId(s)));
    }

    // 3. Users
    const usersCol = this.db.collection('users');
    if (data.users.length > 0) {
      await usersCol.deleteMany({});
      await usersCol.insertMany(data.users.map(u => stripMongoId(u)));
    }

    // 4. Settings
    const settingsCol = this.db.collection('hotel_settings');
    await settingsCol.deleteMany({});
    await settingsCol.insertOne(stripMongoId(data.settings));

    // 5. Audit Logs
    const auditCol = this.db.collection('audit_logs');
    await auditCol.deleteMany({}).catch(() => {});
    if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
      await auditCol.insertMany(data.auditLogs.map((l: any) => stripMongoId(l))).catch(() => {});
    }

    console.log('[MongoDB] Migration to MongoDB complete!');
    return await this.getStatus();
  }

  // ==========================================
  // CRUD: ITEMS (Collection 'items')
  // ==========================================
  public async getItems(query: any = {}): Promise<LostItem[]> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    try {
      const col = this.db!.collection('items');
      let rawDocs = await col.find(query).sort({ dateFound: -1, createdAt: -1, _id: -1 }).toArray();
      
      // If 'items' is empty, check 'lost_items' collection for backwards compatibility
      if (rawDocs.length === 0 && Object.keys(query).length === 0) {
        const altCol = this.db!.collection('lost_items');
        const altDocs = await altCol.find(query).sort({ dateFound: -1, createdAt: -1, _id: -1 }).toArray();
        if (altDocs.length > 0) {
          rawDocs = altDocs;
        }
      }

      return rawDocs.map(doc => this.normalizeItem(doc));
    } catch (err: any) {
      this.handleConnectionError(err);
      throw err;
    }
  }

  public async insertItem(item: LostItem): Promise<LostItem> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('items');
    await col.insertOne({ ...item });
    return item;
  }

  public async updateItem(idOrCode: string, updates: Partial<LostItem>): Promise<LostItem | null> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('items');
    
    // remove _id if present in updates
    const { ...safeUpdates } = updates as any;
    delete safeUpdates._id;

    const orConditions: any[] = [
      { id: idOrCode },
      { code: idOrCode },
      { itemCode: idOrCode },
      { item_code: idOrCode }
    ];

    if (typeof idOrCode === 'string' && ObjectId.isValid(idOrCode)) {
      try {
        orConditions.push({ _id: new ObjectId(idOrCode) });
      } catch (e) {}
    }

    const filter = { $or: orConditions };

    const result = await col.findOneAndUpdate(
      filter,
      { $set: safeUpdates },
      { returnDocument: 'after' }
    );

    if (result) {
      return this.normalizeItem(result);
    }
    return null;
  }

  public async deleteItem(idOrCode: string): Promise<boolean> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('items');
    const orConditions: any[] = [
      { id: idOrCode },
      { code: idOrCode },
      { itemCode: idOrCode },
      { item_code: idOrCode }
    ];
    if (typeof idOrCode === 'string' && ObjectId.isValid(idOrCode)) {
      try {
        orConditions.push({ _id: new ObjectId(idOrCode) });
      } catch (e) {}
    }
    const filter = { $or: orConditions };
    const res = await col.deleteOne(filter);
    return res.deletedCount > 0;
  }

  // ==========================================
  // CRUD: HOTEL SETTINGS
  // ==========================================
  public async getSettings(): Promise<HotelSettings | null> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('hotel_settings');
    const settings = await col.findOne({}, { projection: { _id: 0 } });
    return (settings as unknown) as HotelSettings | null;
  }

  public async updateSettings(settings: Partial<HotelSettings>): Promise<HotelSettings> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('hotel_settings');
    const { ...safe } = settings as any;
    delete safe._id;

    await col.updateOne({}, { $set: safe }, { upsert: true });
    const updated = await col.findOne({}, { projection: { _id: 0 } });
    return (updated as unknown) as HotelSettings;
  }

  // ==========================================
  // CRUD: STAFF MEMBERS
  // ==========================================
  public async getStaff(): Promise<StaffMember[]> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection<StaffMember>('staff_members');
    const staff = await col.find({}).sort({ serial: 1 }).toArray();
    return staff.map(s => {
      const copy: any = { ...s };
      if (s._id) {
        copy._id = s._id.toString();
        if (!copy.id) copy.id = s._id.toString();
      }
      return copy as StaffMember;
    });
  }

  public async insertStaff(staffMember: StaffMember): Promise<StaffMember> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('staff_members');
    await col.insertOne({ ...staffMember });
    return staffMember;
  }

  public async updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    // Guard: Prevent mistakenly updating staff_members if given Super Admin user credentials
    if (id === '6aa686c76139521572917853' || id === 'usr-1' || id.toLowerCase() === 'abusayeedriday@gmail.com') {
      console.warn('[MongoDB] updateStaff called with user ID/email, refusing to overwrite staff_members:', id);
      return null;
    }
    const col = this.db!.collection<StaffMember>('staff_members');
    const { ...safeUpdates } = updates as any;
    delete safeUpdates._id;

    let filter: any;
    if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = {
        $or: [
          { id: id },
          { email: id.toLowerCase() },
          { userId: id }
        ]
      };
    }

    const result = await col.findOneAndUpdate(
      filter,
      { $set: safeUpdates },
      { returnDocument: 'after' }
    );
    if (result) {
      const copy: any = { ...result };
      if (copy._id) copy._id = copy._id.toString();
      return copy as StaffMember;
    }
    return null;
  }

  public async deleteStaff(id: string): Promise<boolean> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('staff_members');
    let filter: any;
    if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = {
        $or: [
          { id },
          { userId: id },
          { email: id.toLowerCase() }
        ]
      };
    }
    const res = await col.deleteOne(filter);
    return res.deletedCount > 0;
  }

  public async importItems(items: LostItem[], mode: 'append' | 'replace' = 'append'): Promise<number> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection('items');
    if (mode === 'replace') {
      await col.deleteMany({});
      if (items.length > 0) {
        await col.insertMany(items.map(item => stripMongoId(item)));
      }
      return items.length;
    } else {
      // Append mode - upsert or insert items
      let insertedCount = 0;
      for (const item of items) {
        const { ...safeItem } = item as any;
        delete safeItem._id;
        await col.updateOne(
          { $or: [{ id: item.id }, { code: item.code }] },
          { $set: safeItem },
          { upsert: true }
        );
        insertedCount++;
      }
      return insertedCount;
    }
  }

  // ==========================================
  // CRUD: USERS & AUTH
  // ==========================================
  public async getUsers(): Promise<User[]> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    const col = this.db!.collection<User>('users');
    const users = await col.find({}).toArray();
    return users.map(u => {
      const copy: any = { ...u };
      if (u._id) {
        copy._id = u._id.toString();
        if (!copy.id) copy.id = u._id.toString();
      }
      return copy as User;
    });
  }

  public async upsertUser(user: User): Promise<User> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    // Guard: Prevent mistakenly inserting staff-1787744343679 or 7843 into users collection
    if (user.id === 'staff-1787744343679' || user.id === '6aa686c76139521572917843' || user.email?.toLowerCase() === 'riday@warwickhotels.com') {
      console.warn('[MongoDB] upsertUser called with staff member record, ignoring for users collection:', user.id);
      return user;
    }
    const col = this.db!.collection('users');
    const { ...safeUser } = user as any;
    delete safeUser._id;

    let filter: any = { email: user.email.toLowerCase() };
    if (user.id && typeof user.id === 'string' && ObjectId.isValid(user.id) && user.id.length === 24) {
      filter = { _id: new ObjectId(user.id) };
    } else if ((user as any)._id && typeof (user as any)._id === 'string' && ObjectId.isValid((user as any)._id)) {
      filter = { _id: new ObjectId((user as any)._id) };
    }

    await col.updateOne(
      filter,
      { $set: safeUser },
      { upsert: true }
    );
    return user;
  }

  // ==========================================
  // CRUD: NOTIFICATIONS
  // ==========================================
  public async getNotifications(): Promise<AppNotification[]> {
    if (!this.isLive) return [];
    try {
      const col = this.db!.collection<AppNotification>('notifications');
      const list = await col.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(200).toArray();
      return list as AppNotification[];
    } catch (e: any) {
      const dropped = this.handleConnectionError(e);
      if (!dropped) {
        console.warn('Mongo getNotifications error:', e?.message || e);
      }
      return [];
    }
  }

  public async insertNotification(notif: AppNotification): Promise<AppNotification> {
    if (!this.isLive) return notif;
    try {
      const col = this.db!.collection('notifications');
      const { ...safeNotif } = notif as any;
      delete safeNotif._id;
      await col.insertOne(safeNotif);
      return notif;
    } catch (e: any) {
      const dropped = this.handleConnectionError(e);
      if (!dropped) {
        console.warn('Mongo insertNotification error:', e?.message || e);
      }
      return notif;
    }
  }

  public async updateNotification(id: string, updates: Partial<AppNotification>): Promise<void> {
    if (!this.isLive) return;
    try {
      const col = this.db!.collection('notifications');
      const { ...safeUpdates } = updates as any;
      delete safeUpdates._id;
      await col.updateOne({ id }, { $set: safeUpdates });
    } catch (e) {
      console.warn('Mongo updateNotification error:', e);
    }
  }

  public async markNotificationRead(id: string, userIdentifier: string): Promise<void> {
    if (!this.isLive || !userIdentifier) return;
    try {
      const col = this.db!.collection('notifications');
      await col.updateOne(
        { id },
        { 
          $addToSet: { readBy: userIdentifier.toLowerCase().trim() }
        }
      );
    } catch (e) {
      console.warn('Mongo markNotificationRead error:', e);
    }
  }

  public async markNotificationUnread(id: string, userIdentifier: string): Promise<void> {
    if (!this.isLive || !userIdentifier) return;
    try {
      const col = this.db!.collection('notifications');
      await col.updateOne(
        { id },
        { 
          $pull: { readBy: userIdentifier.toLowerCase().trim() as any }
        } as any
      );
    } catch (e) {
      console.warn('Mongo markNotificationUnread error:', e);
    }
  }

  public async markAllNotificationsRead(userIdentifier: string): Promise<void> {
    if (!this.isLive || !userIdentifier) return;
    try {
      const col = this.db!.collection('notifications');
      await col.updateMany(
        {},
        { 
          $addToSet: { readBy: userIdentifier.toLowerCase().trim() }
        }
      );
    } catch (e) {
      console.warn('Mongo markAllNotificationsRead error:', e);
    }
  }

  public async deleteNotificationForUser(id: string, userIdentifier: string): Promise<boolean> {
    if (!this.isLive || !userIdentifier) return false;
    try {
      const col = this.db!.collection('notifications');
      const res = await col.updateOne(
        { id },
        { 
          $addToSet: { deletedBy: userIdentifier.toLowerCase().trim() }
        }
      );
      return res.modifiedCount > 0;
    } catch (e) {
      console.warn('Mongo deleteNotificationForUser error:', e);
      return false;
    }
  }

  public async clearNotificationsForUser(userIdentifier: string): Promise<void> {
    if (!this.isLive || !userIdentifier) return;
    try {
      const col = this.db!.collection('notifications');
      await col.updateMany(
        {},
        { 
          $addToSet: { deletedBy: userIdentifier.toLowerCase().trim() }
        }
      );
    } catch (e) {
      console.warn('Mongo clearNotificationsForUser error:', e);
    }
  }

  public async deleteNotification(id: string): Promise<boolean> {
    if (!this.isLive) return false;
    try {
      const col = this.db!.collection('notifications');
      const res = await col.deleteOne({ id });
      return res.deletedCount > 0;
    } catch (e) {
      console.warn('Mongo deleteNotification error:', e);
      return false;
    }
  }

  public async clearNotifications(): Promise<void> {
    if (!this.isLive) return;
    try {
      const col = this.db!.collection('notifications');
      await col.deleteMany({});
    } catch (e) {
      console.warn('Mongo clearNotifications error:', e);
    }
  }

  // ==========================================
  // CRUD: CERTIFICATES (Collection 'certificates')
  // ==========================================
  private normalizeCertificate(doc: any): Certificate {
    if (!doc) return {} as Certificate;
    const rawId = doc.id || (doc._id ? doc._id.toString() : `cert-${Date.now()}`);
    const { _id, ...safeDoc } = doc;
    return {
      ...safeDoc,
      id: String(rawId),
      certificateNumber: doc.certificateNumber || `WRW-CERT-${new Date().getFullYear()}-001`,
      template: doc.template || 'employee_of_month',
      title: doc.title || (doc.template === 'appreciation' ? 'Certificate of Appreciation' : 'Employee of the Month'),
      recipientName: doc.recipientName || 'MD ABU SAYEED RIDAY',
      recipientStaffId: doc.recipientStaffId || undefined,
      recipientPosition: doc.recipientPosition || 'Housekeeping Supervisor',
      recipientDepartment: doc.recipientDepartment || 'Housekeeping',
      awardPeriod: doc.awardPeriod || 'June 2026',
      citationText: doc.citationText || (doc.template === 'appreciation'
        ? 'This certificate is proudly presented to Md Abu Sayeed Riday, Housekeeping Supervisor, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.'
        : 'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!'),
      location: doc.location || 'Al Baha, Saudi Arabia',
      awardDate: doc.awardDate || '15 June 2026',
      signatory1Title: doc.signatory1Title || (doc.template === 'appreciation' ? 'Housekeeping Manager' : 'Housekeeping'),
      signatory1Name: doc.signatory1Name || '',
      signatory1Signature: doc.signatory1Signature || undefined,
      signatory2Title: doc.signatory2Title || 'General Manager',
      signatory2Name: doc.signatory2Name || '',
      signatory2Signature: doc.signatory2Signature || undefined,
      signatory3Title: doc.signatory3Title || undefined,
      signatory3Name: doc.signatory3Name || undefined,
      signatory3Signature: doc.signatory3Signature || undefined,
      showSignatory3: Boolean(doc.showSignatory3),
      notes: doc.notes || undefined,
      issuedBy: doc.issuedBy || 'Super Admin',
      issuedByRole: doc.issuedByRole || 'Super Admin',
      issuedAt: doc.issuedAt || doc.createdAt || new Date().toISOString(),
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || doc.createdAt || new Date().toISOString()
    };
  }

  public async getCertificates(): Promise<Certificate[]> {
    if (!this.isLive) return [];
    try {
      const col = this.db!.collection('certificates');
      const docs = await col.find({}).sort({ issuedAt: -1, createdAt: -1, _id: -1 }).toArray();
      return docs.map(d => this.normalizeCertificate(d));
    } catch (e) {
      console.warn('[MongoDB] getCertificates error:', e);
      return [];
    }
  }

  public async upsertCertificate(cert: Certificate): Promise<Certificate> {
    if (!this.isLive) throw new Error('MongoDB not connected');
    try {
      const col = this.db!.collection('certificates');
      const cleanCert = { ...cert };
      delete (cleanCert as any)._id;

      try {
        await col.updateOne(
          { id: cert.id },
          { $set: cleanCert },
          { upsert: true }
        );
      } catch (upsertErr: any) {
        // If an existing legacy document with _id: null caused E11000 duplicate key error
        if (upsertErr?.message?.includes('duplicate key') || upsertErr?.message?.includes('_id_') || upsertErr?.code === 11000) {
          console.warn('[MongoDB] Detected _id conflict in certificates collection. Repairing legacy _id: null and retrying...');
          try {
            const nullDoc = await col.findOne({ _id: null });
            if (nullDoc) {
              const repaired = { ...nullDoc };
              delete (repaired as any)._id;
              await col.deleteOne({ _id: null });
              if (repaired.id && repaired.id !== cert.id) {
                await col.insertOne(repaired).catch(() => {});
              }
            }
          } catch (cleanErr) {
            console.warn('[MongoDB] Error during certificates _id cleanup:', cleanErr);
          }
          // Retry the upsert with cleanCert
          await col.updateOne(
            { id: cert.id },
            { $set: cleanCert },
            { upsert: true }
          );
        } else {
          throw upsertErr;
        }
      }
      return cert;
    } catch (e: any) {
      console.error('[MongoDB] upsertCertificate error:', e.message);
      throw e;
    }
  }

  public async deleteCertificate(id: string): Promise<boolean> {
    if (!this.isLive) return false;
    try {
      const col = this.db!.collection('certificates');
      const res = await col.deleteOne({ $or: [{ id }, { certificateNumber: id }] } as any);
      return res.deletedCount > 0;
    } catch (e) {
      console.warn('[MongoDB] deleteCertificate error:', e);
      return false;
    }
  }

  // ==========================================
  // CRUD: AUDIT LOGS (Collection 'audit_logs')
  // ==========================================
  private normalizeAuditLog(doc: any): AuditLog {
    if (!doc) return {} as AuditLog;
    const rawId = doc.id || (doc._id ? doc._id.toString() : `audit-${Date.now()}`);
    return {
      id: String(rawId),
      action: doc.action || 'System Action',
      actionType: doc.actionType || (doc.action?.toLowerCase().includes('status') ? 'status_change' : 'update'),
      entityType: doc.entityType || 'item',
      entityId: doc.entityId,
      itemCode: doc.itemCode,
      itemName: doc.itemName,
      category: doc.category,
      previousStatus: doc.previousStatus,
      newStatus: doc.newStatus,
      performedBy: doc.performedBy || 'Staff',
      userRole: doc.userRole || doc.performedByRole || 'Staff',
      performedByRole: doc.performedByRole || doc.userRole || 'Staff',
      performedByEmail: doc.performedByEmail,
      performedById: doc.performedById,
      timestamp: doc.timestamp || doc.createdAt || new Date().toISOString(),
      details: doc.details || '',
      reason: doc.reason,
      changes: Array.isArray(doc.changes) ? doc.changes : undefined,
      ip: doc.ip,
      deviceType: doc.deviceType,
      browser: doc.browser,
      meta: doc.meta
    };
  }

  public async getAuditLogs(query: any = {}, limit = 1000): Promise<AuditLog[]> {
    if (!this.isLive) return [];
    try {
      const col = this.db!.collection('audit_logs');
      const docs = await col.find(query).sort({ timestamp: -1, _id: -1 }).limit(limit).toArray();
      return docs.map(d => this.normalizeAuditLog(d));
    } catch (e: any) {
      console.warn('[MongoDB] getAuditLogs error:', e.message);
      return [];
    }
  }

  public async insertAuditLog(log: AuditLog): Promise<AuditLog> {
    if (!this.isLive) return log;
    try {
      const col = this.db!.collection('audit_logs');
      const cleanLog = { ...log };
      delete (cleanLog as any)._id;
      await col.updateOne(
        { id: log.id },
        { $set: cleanLog },
        { upsert: true }
      );
      return log;
    } catch (e: any) {
      console.warn('[MongoDB] insertAuditLog error:', e.message);
      return log;
    }
  }

  public async deleteAuditLog(id: string): Promise<boolean> {
    if (!this.isLive) return false;
    try {
      const col = this.db!.collection('audit_logs');
      const res = await col.deleteOne({ id } as any);
      return (res.deletedCount || 0) > 0;
    } catch (e: any) {
      console.warn('[MongoDB] deleteAuditLog error:', e.message);
      return false;
    }
  }

  public async deleteAuditLogs(ids: string[]): Promise<number> {
    if (!this.isLive || !ids || ids.length === 0) return 0;
    try {
      const col = this.db!.collection('audit_logs');
      const res = await col.deleteMany({ id: { $in: ids } });
      return res.deletedCount || 0;
    } catch (e: any) {
      console.warn('[MongoDB] deleteAuditLogs error:', e.message);
      return 0;
    }
  }

  public async clearAuditLogs(): Promise<void> {
    if (!this.isLive) return;
    try {
      const col = this.db!.collection('audit_logs');
      await col.deleteMany({});
    } catch (e: any) {
      console.warn('[MongoDB] clearAuditLogs error:', e.message);
    }
  }
}

export const mongoService = new MongoService();
