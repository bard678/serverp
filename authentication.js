import bcryptjs from 'bcryptjs';

import jsonwebtoken from 'jsonwebtoken';
import axios from 'axios'
import nodemailer from 'nodemailer';

import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';


//dotenv.config(); 
// Load environment variables

//const VERIFY_EMAIL_URL = process.env.SERVER_URL + "/api/auth/verify"; // Load from env

// **Rate Limiting to Prevent Brute Force Attacks**
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes
  message: "Too many login attempts, please try again later.",
});

import crypto from 'crypto'; // For generating random verification code

function ResendCode(app,db){
 
     app.post('/send/code',async (req,res)=>{
      const {email} =req.body
      const verificationCode = generateVerificationCode(); // Generate a verification code
      const isChecked=  await checkEmail(email, res,verificationCode)
      if(isChecked)
        {  
            
          const query = 'UPDATE users SET verification_code=? WHERE email =?';
          db.query(query, [verificationCode,email], (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Error registering user');
            }
          });
        }
    })
}

 function Register(app, db) {
  app.post('/register', async (req, res) => {
    const { name, account, password, profilePicture, email } = req.body;
    console.log("Reg.....")
    if (!name  || !password || !email) {
      return res.status(400).send("All fields are required");
    }

    try 
    {
      // **Check if email or account exists**
      const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(checkUserQuery, [email], async (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Database error');
        }

        if (results.length > 0) {
          return res.status(400).send({'msg':'Email is used by another user'});
        }

        const hashedPassword = await bcryptjs.hash(password, 12); // More secure hash

     const verificationCode = generateVerificationCode(); // Generate a verification code
     const isChecked=  await checkEmail(email, res,verificationCode)
    if(isChecked)
      {  

        const query = 'INSERT INTO users (id, name, email, profilePicture, password, verification_code) VALUES (UUID(), ?, ?, ?, ?, ?)';
        db.query(query, [name, email, profilePicture || null, hashedPassword, verificationCode], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error registering user');
          }
        });
      }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });
}
async function checkEmail(email, res,verificationCode){

  
  if (!email) {
     res.status(400).json({ msg: "Email is required" });
}
sendVerificationEmail(email, verificationCode,res);
return true
try {
    const response = await axios.get(
        `https://api.emaillistverify.com/api/verifyEmail?secret=2hFZnwx1sQ7CFM7HurJx2&email=${email}`
    );

    if (response.data === "ok") {
    
      sendVerificationEmail(email, verificationCode,res);
      return true
    } else {
    
      console.log("Email does not exist")
       //  res.status(400).json({ msg: "Email does not exist" });
         return false
    }
} catch (error) {
    console.error(error);
   // return res.status(500).json({ message: "Error checking email" });
}
}
// **Secure Email Transport**
async function sendVerificationEmail(email, verificationCode,res) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use app password
    },
  });

  const mailOptions = {
    from: process.env.COMPANY,
    to: email,
    subject: 'Verify Your Email',
    html: `<p> Hi  Your verification code is: <strong>${verificationCode}</strong></p>
           <p>Please enter this code to verify your email.</p>`,
  };

  try {
   
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
     return res.status(500).json({ success: false, msg: 'Error sending email', error });
      }
  
//      console.log(`Email sent: ${info.rejected}`);
  
      // **Check if the email was rejected**
     
  
      return res.status(200).json({ success: true, msg: 'Verification email sent successfully' });
    });
  
    //console.log('Verification email sent');

   // res.status(201).json({"msg": 'Verification email sent', });
  } catch (error) {
    console.error('Error sending email:', error);
   // res.status(409).json({"msg": `Error sending email: ${error}`, });
  }
}

function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per windowMs per IP
  message: 'Too many login attempts. Please try again later.',
});
//TODO login
function Login(app, db) {
  app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({"msg":"Email and password are required"});
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({"msg":"Error logging in"});
      }

      if (results.length === 0) {
        return res.status(400).send({"msg":"Account not found"});
      }

      const user = results[0];
      
      if (!user.verified) {
      // res.status(400).send({"msg":"Please verify your email before logging in.","verified":user.verified});
       const verificationCode = generateVerificationCode(); // Generate a verification code
       const isChecked=  await checkEmail(email, res,verificationCode)
      if(isChecked)
        {  
           // isVerified
       // console.log(isChecked)
     await  completeLogin()
        }
      }
      else{
        await completeLogin()
      }
      async function completeLogin(){
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).send({"msg":"Incorrect password"});
        }
        if(!user.verified){
          return res.status(401).send({"msg":"Your email is not verified yet.","verified":0});

        }
        // Generate Access & Refresh Tokensz
        const accessToken = jsonwebtoken.sign(
          { id: user.id, name: user.name, email: user.email },
          process.env.ACCESS_SECRET,  // Short expiration
          { expiresIn: '35m' }
        );
  
        const refreshToken = jsonwebtoken.sign(
          { id: user.id },
          process.env.REFRESH_SECRET, // Long expiration
          { expiresIn: '7d' }
        );
  
        // Store refresh token in database
        db.query("UPDATE users SET refresh_token = ?   WHERE id = ?", [refreshToken, user.id]);
  
      return  res.status(200).json({
          message: 'Login successful',
          accessToken,
          refreshToken, // Send refresh token to client
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          id: user.id,
          verified:user.verified
        });
        
       }
    
    });
  });
}


 function RefreshToken(app, db) {
  app.post('/refresh', (req, res) => {
    const { refresh } = req.body;
    console.log("refreshing...")
    if (!refresh) return res.status(403).send("No refresh token provided");

    // Check if refresh token exists in database
    db.query("SELECT * FROM users WHERE refresh_token = ?", [refresh], (err, results) => {
      if (err || results.length === 0) return res.status(403).send("Invalid refresh token");
      
      jsonwebtoken.verify(refresh, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).send("Token expired or invalid");

        // Generate new Access Token
        const newAccessToken = jsonwebtoken.sign(
          { id: user.id },
          process.env.ACCESS_SECRET,
          { expiresIn: '15m' }
        );
     const   currentUser=results[0];
        res.json({ "accessToken": newAccessToken ,"name": currentUser.name ,"email":currentUser.email,"profilePicture":currentUser.profilePicture });
      });
    });
  });
}




function VerifyEmail(app, db) {
  app.get('/auth/verify/:code', (req, res) => {
    const { code } = req.params;

    const query = 'SELECT * FROM users WHERE verification_code = ? ';
    db.query(query, [code], (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).send({"msg":"Invalid or expired code"});
      }

      const user = results[0];
      
     // Generate Access & Refresh Tokens
     const accessToken = jsonwebtoken.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.ACCESS_SECRET,  // Short expiration
      { expiresIn: '35m' }
    );

    const refreshToken = jsonwebtoken.sign(
      { id: user.id },
      process.env.REFRESH_SECRET, // Long expiration
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    db.query("UPDATE users SET refresh_token = ?,verified = TRUE, verification_code =NULL   WHERE id = ?", [refreshToken, user.id]);
  console.log(accessToken);
  return  res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken, // Send refresh token to client
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      id: user.id,
      verified:1
    });
 
  });
}
  )}

export { VerifyEmail, Register, Login,jsonwebtoken ,RefreshToken,ResendCode};
