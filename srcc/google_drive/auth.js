import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Set up OAuth2 client
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = path.join(__dirname, 'token.json');
const credentials = JSON.parse(fs.readFileSync('credentials.json'));

// Create an OAuth2 client with the provided credentials
const { client_id, client_secret, redirect_uris } = credentials.web;
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Check if we have a stored token
fs.readFile(TOKEN_PATH, (err, token) => {
  if (err) {
    getNewToken(oauth2Client);
  } else {
    oauth2Client.setCredentials(JSON.parse(token));
    listFiles(oauth2Client);
  }
});

// Get and store a new token if none exists
function getNewToken(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oauth2Client.setCredentials(token);
      // Store the token for future use
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      listFiles(oauth2Client);
    });
  });
}

// List files in the authenticated user's Google Drive
function listFiles(auth) {
  const drive = google.drive({ version: 'v3', auth });
  drive.files.list({}, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}



// Upload a file
function uploadFile(auth) {
  const drive = google.drive({ version: 'v3', auth });
  const fileMetadata = {
    name: 'photo.jpg',
  };
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream('path/to/photo.jpg'),
  };

  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
      fields: 'id',
    },
    (err, file) => {
      if (err) {
        console.log('Error uploading file:', err);
      } else {
        console.log('File uploaded successfully:', file.data.id);
      }
    }
  );
}
