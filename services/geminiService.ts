import { GoogleGenAI } from "@google/genai";
import { InventoryItem, StockMovement } from "../types";

// Remove global initialization to prevent crash on load
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 

export const generateInventoryInsight = async (
  items: InventoryItem[], 
  movements: StockMovement[]
): Promise<string> => {
  const apiKey = localStorage.getItem('nexus_gemini_api_key') || process.env.GEMINI_API_KEY || process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "API Key not configured. Please configure it in Settings > AI Configuration.";

  const lowStock = items.filter(i => i.quantity <= i.minStockLevel);
  // Using unitCost for inventory valuation (fall back to wholesalePrice if unitCost missing from old data)
  const totalValue = items.reduce((acc, i) => acc + (i.quantity * (i.unitCost || i.wholesalePrice)), 0);
  
  const prompt = `
    Analyze the following inventory data and provide a concise executive summary and 3 actionable recommendations.
    
    Data:
    - Total Items: ${items.length}
    - Total Inventory Value (Cost): ₱${totalValue.toFixed(2)}
    - Low Stock Items Count: ${lowStock.length}
    - Recent Movements: ${movements.slice(0, 10).map(m => `${m.type} ${m.quantity} of Item ${m.itemId}`).join(', ')}
    
    Low Stock Details: ${lowStock.map(i => `${i.name} (Qty: ${i.quantity}, Min: ${i.minStockLevel}, Speed: ${i.movementSpeed})`).join(', ')}

    Format as Markdown. Be professional and brief.
  `;

  try {
    // Initialize locally
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing inventory data. Please check your API key.";
  }
};

export const generateItemDescription = async (name: string, category: string): Promise<string> => {
  const apiKey = localStorage.getItem('nexus_gemini_api_key') || process.env.GEMINI_API_KEY || process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "";

  try {
    // Initialize locally
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, professional product description (max 2 sentences) for an inventory item named "${name}" in the category "${category}".`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};