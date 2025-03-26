// src/config/jwtConfig.js

// JWT configuration settings
export const jwtConfig = {
    secretKey: process.env.ACCESS_SECRET||"fksfsjksjsgjklsjbslfkbsfb4545515211bbsbsb5sb4s54bs5bs" , // Read secret key from environment variables, default to a fallback key
    expiresIn: '35m', // Set the expiration time for the JWT token
  };
  