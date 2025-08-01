// server.js
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const qs = require('qs');
const cors = require('cors');

const app = express();
const port = 3001; // We'll run this server on a different port

// Use CORS to allow your React app (e.g., on port 5173) to call this server
app.use(cors());

// Your secret credentials - KEEP THEM OUT OF THE REACT CODE
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const resource = 'https://service.flow.microsoft.com/';
// Azure AD token endpoint
const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;

// Create an endpoint that your React app can call
app.post('/api/get-token', async (req, res) => {
  console.log('Received request for access token...');
  try {
    const requestBody = qs.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      resource: resource
    });

    const response = await axios.post(tokenEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    console.log('Token acquired successfully.');
    // Send the access token back to the React app
    res.json({ accessToken: response.data.access_token });

  } catch (error) {
    console.error('Error in /api/get-token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to acquire access token' });
  }
});

app.listen(port, () => {
  console.log(`✅ Local token server running at http://localhost:${port}`);
});