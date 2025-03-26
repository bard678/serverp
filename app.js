
import express from 'express';
import mysql from 'mysql2';
import body from 'body-parser';
import cors from 'cors';


import { uploadFile } from './storage.js';
import { UploadImage, UploadReel } from './upload.js';
import { Login, RefreshToken, Register, VerifyEmail,ResendCode } from './authentication.js';
import { LoadPosts, LoadShorts } from './home_page.js';
// Initialize Express
const app = express();
app.use(cors());
app.use(body.json());
const PORT = 3000;

// Create MySQL Connection
const db = mysql.createPool({
  host: 'localhost', // Replace with your database host
  user: 'root',      // Replace with your database username
  password: '1234', // Replace with your database password
  database: 'flambix_test' , // Replace with your database name
  waitForConnections: true,
  connectionLimit: 10, // adjust based on expected load and DB capacity
  queueLimit: 0
});

// Connect to MySQL
ResendCode(app,db)
UploadImage(app,db);
UploadReel(app,db);
//{"/login"}
Login(app,db);
RefreshToken(app,db);
//{"/register"}

Register(app,db);
VerifyEmail(app,db);
// Fetch Users posts
LoadPosts(app,db);
LoadShorts(app,db)
app.get('/users', (req, res) => {
  const query = 'SELECT * FROM users';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err.stack);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.status(200).json(results); // Send users data as JSON
  });
});

// Start Server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});