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
          { properties: { title: 'Expenses' } },
          { properties: { title: 'Wallet' } },
          { properties: { title: 'Categories' } },
          { properties: { title: 'CompanyInfo' } },
          { properties: { title: 'Users' } },
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

  // ... (syncItems, syncSuppliers, syncMovements remain the same) ...

  // 5. Sync Expenses
  public async syncExpenses(expenses: any[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;
    const header = ['id', 'description', 'amount', 'category', 'date'];
    const rows = expenses.map(e => [e.id, e.description, e.amount, e.category, e.date]);
    const values = [header, ...rows];
    await this.writeSheet('Expenses', values);
  }

  // 6. Sync Wallet
  public async syncWallet(transactions: any[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;
    const header = ['id', 'type', 'amount', 'date', 'reason', 'userId', 'userName'];
    const rows = transactions.map(t => [t.id, t.type, t.amount, t.date, t.reason, t.userId || '', t.userName || '']);
    const values = [header, ...rows];
    await this.writeSheet('Wallet', values);
  }

  // 7. Sync Categories
  public async syncCategories(categories: string[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;
    const header = ['category'];
    const rows = categories.map(c => [c]);
    const values = [header, ...rows];
    await this.writeSheet('Categories', values);
  }

  // 8. Sync Company Info
  public async syncCompanyInfo(info: any): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;
    const header = ['key', 'value'];
    const rows = Object.entries(info);
    const values = [header, ...rows];
    await this.writeSheet('CompanyInfo', values);
  }

  // 9. Sync Users
  public async syncUsers(users: any[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;
    const header = ['id', 'username', 'password', 'name', 'role', 'lastLogin'];
    const rows = users.map(u => [u.id, u.username, u.password, u.name, u.role, u.lastLogin || '']);
    const values = [header, ...rows];
    await this.writeSheet('Users', values);
  }

  // Helper to write to sheet
  private async writeSheet(sheetName: string, values: any[][]): Promise<void> {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:Z${values.length}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
  }

  // 10. Sync All Data
  public async syncAll(
      items: InventoryItem[], 
      suppliers: Supplier[], 
      movements: StockMovement[],
      expenses: any[],
      wallet: any[],
      categories: string[],
      companyInfo: any,
      users: any[]
  ): Promise<void> {
      if (!this.isAuthenticated() || !this.hasSpreadsheet()) return;
      
      await Promise.all([
          this.syncItems(items),
          this.syncSuppliers(suppliers),
          this.syncMovements(movements),
          this.syncExpenses(expenses),
          this.syncWallet(wallet),
          this.syncCategories(categories),
          this.syncCompanyInfo(companyInfo),
          this.syncUsers(users)
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
