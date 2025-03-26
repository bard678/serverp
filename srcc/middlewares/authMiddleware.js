// src/middlewares/authMiddleware.js
import jsonwebtoken from 'jsonwebtoken';
import { jwtConfig } from '../config/jwtConfig.js';


/**
  Middleware to authenticate and validate JWT token.
 */
 
//TODO  Middleware to authenticate and validate JWT token.
export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']; 
  const token = authHeader && authHeader.split(' ')[1]; 

  console.log("Received Token:", token); // Debugging

  if (!token) {
    return res.status(401).json({ error: 'Token is required', msg: 'No token provided' });
  }
console.log(jwtConfig.secretKey);
  jsonwebtoken.verify(token, jwtConfig.secretKey, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err); 

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired', msg: 'Please log in again.' });
      }
      
      return res.status(403).json({
        error: 'Invalid or expired token',
        msg: err.message || 'Token verification failed. Please log in again.',
      });
    }

    if (!user) {
      return res.status(403).json({ error: 'Invalid token', msg: 'Failed to decode token.' });
    }

    req.user = user; 
    next();
  });
}

