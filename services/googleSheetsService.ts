import { InventoryItem, Supplier, StockMovement } from '../types';

// --- Types ---
export interface GoogleSheetConfig {
  spreadsheetId: string;
  sheetName: string;
}

export interface GoogleAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// --- Service ---
class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private tokens: GoogleAuthTokens | null = null;
  private spreadsheetId: string | null = null;

  private constructor() {}

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  public setTokens(tokens: GoogleAuthTokens) {
    this.tokens = tokens;
    // Persist tokens securely (e.g., localStorage for now, but ideally HTTP-only cookie)
    localStorage.setItem('google_tokens', JSON.stringify(tokens));
  }

  public loadTokens() {
    const stored = localStorage.getItem('google_tokens');
    if (stored) {
      this.tokens = JSON.parse(stored);
    }
  }

  public setSpreadsheetId(id: string) {
    this.spreadsheetId = id;
    localStorage.setItem('google_spreadsheet_id', id);
  }

  public loadSpreadsheetId() {
    const stored = localStorage.getItem('google_spreadsheet_id');
    if (stored) {
      this.spreadsheetId = stored;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.tokens;
  }

  public hasSpreadsheet(): boolean {
    return !!this.spreadsheetId;
  }

  // --- API Calls ---
  
  // 1. Create a new Spreadsheet for the inventory
  public async createSpreadsheet(title: string = 'Nexus Inventory Data'): Promise<string> {
    if (!this.tokens) throw new Error('Not authenticated');

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          { properties: { title: 'Items' } },
          { properties: { title: 'Suppliers' } },
          { properties: { title: 'Movements' } },
          { properties: { title: 'Settings' } },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create spreadsheet: ${error.error.message}`);
    }

    const data = await response.json();
    this.setSpreadsheetId(data.spreadsheetId);
    return data.spreadsheetId;
  }

  // 2. Sync Items (Write all items to sheet)
  public async syncItems(items: InventoryItem[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) throw new Error('Not connected to Google Sheets');

    // Convert items to rows
    // Header: ID, Name, SKU, Category, Quantity, Cost, Price...
    const header = ['id', 'name', 'sku', 'category', 'quantity', 'unitCost', 'retailPrice', 'wholesalePrice', 'minStockLevel', 'supplierId', 'description', 'imageUrl', 'images', 'imageFit', 'movementSpeed'];
    
    const rows = items.map(item => [
      item.id,
      item.name,
      item.sku,
      item.category,
      item.quantity,
      item.unitCost,
      item.retailPrice,
      item.wholesalePrice,
      item.minStockLevel,
      item.supplierId,
      item.description,
      item.imageUrl || '',
      JSON.stringify(item.images || []), // Store arrays as JSON strings
      item.imageFit || 'cover',
      item.movementSpeed
    ]);

    const values = [header, ...rows];

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Items!A1:O${values.length}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
        throw new Error('Failed to sync items');
    }
  }

  // 3. Sync Suppliers
  public async syncSuppliers(suppliers: Supplier[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;

    const header = ['id', 'name', 'contactPerson', 'phone', 'email', 'address'];
    const rows = suppliers.map(s => [s.id, s.name, s.contactPerson, s.phone, s.email, s.address]);
    const values = [header, ...rows];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Suppliers!A1:F${values.length}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
  }

  // 4. Sync Movements
  public async syncMovements(movements: StockMovement[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;

    const header = ['id', 'itemId', 'type', 'quantity', 'date', 'reason', 'userId', 'notes'];
    const rows = movements.map(m => [
      m.id, 
      m.itemId, 
      m.type, 
      m.quantity, 
      m.date, 
      m.reason, 
      m.userId || 'System',
      m.notes || ''
    ]);
    const values = [header, ...rows];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Movements!A1:H${values.length}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
  }

  // 5. Sync All Data
  public async syncAll(items: InventoryItem[], suppliers: Supplier[], movements: StockMovement[]): Promise<void> {
      if (!this.isAuthenticated() || !this.hasSpreadsheet()) return;
      
      await Promise.all([
          this.syncItems(items),
          this.syncSuppliers(suppliers),
          this.syncMovements(movements)
      ]);
  }

  // 6. Fetch Items (Read all items from sheet)
  public async fetchItems(): Promise<InventoryItem[]> {
    if (!this.tokens || !this.spreadsheetId) throw new Error('Not connected to Google Sheets');

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Items!A:O`, {
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch items');

    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length < 2) return []; // No data or just header

    // Skip header row
    return rows.slice(1).map((row: any[]) => ({
      id: row[0],
      name: row[1],
      sku: row[2],
      category: row[3],
      quantity: Number(row[4]),
      unitCost: Number(row[5]),
      retailPrice: Number(row[6]),
      wholesalePrice: Number(row[7]),
      minStockLevel: Number(row[8]),
      supplierId: row[9],
      description: row[10],
      imageUrl: row[11],
      images: row[12] ? JSON.parse(row[12]) : [],
      imageFit: row[13] as 'cover' | 'contain',
      movementSpeed: row[14] as 'Fast' | 'Slow' | 'Normal'
    }));
  }
}

export default GoogleSheetsService.getInstance();
