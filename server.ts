import express from 'express';
import { createServer as createViteServer } from 'vite';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// --- Google OAuth Configuration ---
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// The redirect URI must match exactly what is configured in Google Cloud Console
// For development, it's usually http://localhost:3000/auth/callback
// In production, it's the deployed URL + /auth/callback
// We'll determine this dynamically or use an env var
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';

const oauth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// --- API Routes ---

// 1. Get Auth URL
app.get('/api/auth/url', (req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google Client ID/Secret not configured' });
  }

  // Construct the redirect URI based on the request host if not set
  // This is crucial for dynamic preview environments
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const currentRedirectUri = process.env.REDIRECT_URI || `${protocol}://${host}/auth/callback`;
  
  // Update the client with the correct redirect URI
  oauth2Client.redirectUri = currentRedirectUri;

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/spreadsheets', // Read/Write Sheets
    'https://www.googleapis.com/auth/drive.file',   // Create/List Sheets created by this app
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
  });

  res.json({ url });
});

// 2. Exchange Code for Tokens
app.post('/api/auth/token', async (req, res) => {
  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Ensure the redirect URI matches the one used to generate the auth URL
    if (redirectUri) {
        oauth2Client.redirectUri = redirectUri;
    }
    
    const { tokens } = await oauth2Client.getToken(code);
    // In a real app, you might store the refresh token in a database associated with the user
    // For this architecture, we'll return the tokens to the client to store (encrypted/securely)
    // or keep them in an HTTP-only cookie.
    // Given the "Google Sheet as Database" requirement, the client needs to make calls directly 
    // or via a proxy. Proxy is safer.
    
    // For simplicity in this "Serverless-like" architecture, we'll return the tokens
    // so the client can use them in subsequent requests or store them.
    // Ideally, we set an HTTP-only cookie for the session.
    
    res.json({ tokens });
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token', details: error.message });
  }
});

// 3. Proxy Google Sheets API calls (Optional but recommended for security)
// This allows us to keep the Client Secret on the server
app.post('/api/sheets/proxy', async (req, res) => {
    const { tokens, method, endpoint, body } = req.body;
    
    if (!tokens) {
        return res.status(401).json({ error: 'Missing tokens' });
    }

    try {
        oauth2Client.setCredentials(tokens);
        
        // Example: generic proxy (simplified)
        // In production, you'd have specific routes like /api/inventory/sync
        const response = await oauth2Client.request({
            url: `https://sheets.googleapis.com/v4/spreadsheets/${endpoint}`,
            method,
            data: body,
        });
        
        res.json(response.data);
    } catch (error: any) {
        console.error('Sheets Proxy Error:', error);
        res.status(500).json({ error: 'Sheets API Error', details: error.message });
    }
});


// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    // app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
