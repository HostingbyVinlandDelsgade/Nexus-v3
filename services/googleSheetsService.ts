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

  public clearSpreadsheetId() {
    this.spreadsheetId = null;
    localStorage.removeItem('google_spreadsheet_id');
  }

  public clearTokens() {
    this.tokens = null;
    localStorage.removeItem('google_tokens');
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
          { properties: { title: 'Reports' } },
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
        await this.handleError(response);
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

  // 10. Sync Reports (Calculated Daily Summary)
  public async syncReports(movements: StockMovement[], expenses: any[]): Promise<void> {
    if (!this.tokens || !this.spreadsheetId) return;

    // Calculate Daily Summary
    const dailyStats: Record<string, { revenue: number; expenses: number; profit: number }> = {};

    // Process Sales (Revenue)
    movements.forEach(m => {
        if (m.type === 'OUT') {
            const date = m.date.split('T')[0];
            if (!dailyStats[date]) dailyStats[date] = { revenue: 0, expenses: 0, profit: 0 };
            
            // Note: We don't have item price here easily without joining items.
            // For simplicity in this sync, we'll rely on what we can get or just skip detailed profit if complex.
            // Actually, we can't calculate revenue accurately without item prices.
            // Let's just sync the raw data which we already did in 'Movements'.
            
            // BETTER APPROACH: Let's create a "Daily Sales Report" based on the movements we have.
            // But we need the item prices. 
            // Let's assume the caller passes 'items' as well if we want to do this here.
            // Or we can just skip this if the user just wanted "Reports" tab to exist.
            
            // The user asked "even report is in spread sheet?".
            // Let's try to provide a simple daily summary if possible.
            // I'll update the signature to accept items.
        }
    });
    
    // Since I can't easily change the signature of syncAll in this step without breaking things or making it complex,
    // I will implement a simpler version that just sets up the headers for now, 
    // OR I will rely on the fact that I can fetch items if I really wanted to.
    
    // Actually, the best way to "put reports in spreadsheet" is to use Spreadsheet Formulas.
    // I will write a "Reports" sheet that uses formulas to calculate totals from the other sheets!
    // This is much better than static values.
    
    const header = ['Report Type', 'Value', 'Note'];
    const rows = [
        ['Generated At', new Date().toLocaleString(), ''],
        ['Total Items', '=COUNTA(Items!A2:A)', 'Count of all inventory items'],
        ['Total Inventory Value', '=SUMPRODUCT(Items!E2:E, Items!F2:F)', 'Quantity * Unit Cost'],
        ['Total Revenue (All Time)', '=SUMIF(Wallet!B2:B, "SALE", Wallet!C2:C)', 'Sum of all SALE transactions'],
        ['Total Expenses (All Time)', '=SUM(Expenses!C2:C)', 'Sum of all expenses'],
        ['Net Cash Flow', '=SUMIF(Wallet!B2:B, "DEPOSIT", Wallet!C2:C) + SUMIF(Wallet!B2:B, "SALE", Wallet!C2:C) - SUMIF(Wallet!B2:B, "EXPENSE", Wallet!C2:C) - SUMIF(Wallet!B2:B, "WITHDRAWAL", Wallet!C2:C)', 'Calculated from Wallet'],
    ];
    
    const values = [header, ...rows];
    await this.writeSheet('Reports', values);
  }

  // Helper to write to sheet
  private async writeSheet(sheetName: string, values: any[][]): Promise<void> {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:Z${values.length}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
        await this.handleError(response);
    }
  }

  private async handleError(response: Response) {
      const text = await response.text();
      let errMsg = response.statusText;
      try {
          const json = JSON.parse(text);
          errMsg = json.error?.message || errMsg;
      } catch (e) {}

      if (response.status === 401) {
          this.clearTokens();
          throw new Error('Authentication expired. Please reconnect Google Drive.');
      }
      if (response.status === 404) {
          this.clearSpreadsheetId();
          throw new Error('Spreadsheet not found (it may have been deleted). Please click Sync again to create a new one.');
      }

      throw new Error(`Google Sheets API Error: ${errMsg}`);
  }

  // 11. Sync All Data
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
      
      // Execute sequentially to avoid rate limits (Google Sheets API limit is 60 req/min)
      try {
          await this.syncItems(items);
          await new Promise(r => setTimeout(r, 500)); // 500ms delay
          
          await this.syncSuppliers(suppliers);
          await new Promise(r => setTimeout(r, 500));
          
          await this.syncMovements(movements);
          await new Promise(r => setTimeout(r, 500));
          
          await this.syncExpenses(expenses);
          await new Promise(r => setTimeout(r, 500));
          
          await this.syncWallet(wallet);
          await new Promise(r => setTimeout(r, 500));
          
          await this.syncCategories(categories);
          await new Promise(r => setTimeout(r, 500));
          
          await this.syncCompanyInfo(companyInfo);
          await new Promise(r => setTimeout(r, 500));
          
          await this.syncUsers(users);
          await new Promise(r => setTimeout(r, 500));

          await this.syncReports(movements, expenses);
      } catch (error) {
          console.error('Error during sequential sync:', error);
          throw error; // Re-throw to be caught by caller
      }
  }

  // 6. Fetch Items
  public async fetchItems(): Promise<InventoryItem[]> {
    const rows = await this.readSheet('Items');
    if (rows.length < 2) return [];
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

  // 7. Fetch Suppliers
  public async fetchSuppliers(): Promise<Supplier[]> {
    const rows = await this.readSheet('Suppliers');
    if (rows.length < 2) return [];
    return rows.slice(1).map((row: any[]) => ({
      id: row[0],
      name: row[1],
      contactPerson: row[2],
      phone: row[3],
      email: row[4],
      address: row[5],
      status: 'Active' // Default
    }));
  }

  // 8. Fetch Movements
  public async fetchMovements(): Promise<StockMovement[]> {
    const rows = await this.readSheet('Movements');
    if (rows.length < 2) return [];
    return rows.slice(1).map((row: any[]) => ({
      id: row[0],
      itemId: row[1],
      type: row[2] as any,
      quantity: Number(row[3]),
      date: row[4],
      reason: row[5],
      userId: row[6],
      notes: row[7]
    }));
  }

  // 9. Fetch Expenses
  public async fetchExpenses(): Promise<any[]> {
    const rows = await this.readSheet('Expenses');
    if (rows.length < 2) return [];
    return rows.slice(1).map((row: any[]) => ({
      id: row[0],
      description: row[1],
      amount: Number(row[2]),
      category: row[3],
      date: row[4]
    }));
  }

  // 10. Fetch Wallet
  public async fetchWallet(): Promise<any[]> {
    const rows = await this.readSheet('Wallet');
    if (rows.length < 2) return [];
    return rows.slice(1).map((row: any[]) => ({
      id: row[0],
      type: row[1],
      amount: Number(row[2]),
      date: row[3],
      reason: row[4],
      userId: row[5],
      userName: row[6]
    }));
  }

  // 11. Fetch Categories
  public async fetchCategories(): Promise<string[]> {
    const rows = await this.readSheet('Categories');
    if (rows.length < 2) return [];
    return rows.slice(1).map((row: any[]) => row[0]).filter(Boolean);
  }

  // 12. Fetch Company Info
  public async fetchCompanyInfo(): Promise<any> {
    const rows = await this.readSheet('CompanyInfo');
    if (rows.length < 2) return {};
    const info: any = {};
    rows.slice(1).forEach((row: any[]) => {
      if(row[0]) info[row[0]] = row[1];
    });
    return info;
  }

  // 13. Fetch Users
  public async fetchUsers(): Promise<any[]> {
    const rows = await this.readSheet('Users');
    if (rows.length < 2) return [];
    return rows.slice(1).map((row: any[]) => ({
      id: row[0],
      username: row[1],
      password: row[2],
      name: row[3],
      role: row[4],
      lastLogin: row[5]
    }));
  }

  // Helper to read sheet
  private async readSheet(sheetName: string): Promise<any[][]> {
    if (!this.tokens || !this.spreadsheetId) throw new Error('Not connected');
    
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A:Z`, {
      headers: { 'Authorization': `Bearer ${this.tokens.access_token}` },
    });

    if (!response.ok) await this.handleError(response);
    
    const data = await response.json();
    return data.values || [];
  }

  // 14. Fetch All Data
  public async fetchAll() {
      if (!this.isAuthenticated() || !this.hasSpreadsheet()) throw new Error('Not connected');
      
      const [items, suppliers, movements, expenses, wallet, categories, companyInfo, users] = await Promise.all([
          this.fetchItems(),
          this.fetchSuppliers(),
          this.fetchMovements(),
          this.fetchExpenses(),
          this.fetchWallet(),
          this.fetchCategories(),
          this.fetchCompanyInfo(),
          this.fetchUsers()
      ]);

      return { items, suppliers, movements, expenses, wallet, categories, companyInfo, users };
  }
}

export default GoogleSheetsService.getInstance();
