
import jwt from "jsonwebtoken";

import { jsonwebtoken } from "./authentication.js";
import dotenv from 'dotenv';
import { verifyToken } from "./srcc/middlewares/authMiddleware.js";
dotenv.config();



//TODO Un used for now authenticate Token
export function authenticateToken(req, res, next) {

    // TODO:  check token
    const authHeader = req.headers['authorization']; // Get token from Authorization header
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  
    if (!token) {
      return res.status(401).json({ error: 'Token is required' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' ,'msg': err.message});
      }
      req.user = user; // Attach decoded user data to request
      next();
    });
  }

export function LoadShorts(app,db){
  app.get('/videos',verifyToken, (req, res) => {
    db.query(
            `  SELECT 
                d.*, 
                u.name, 
                u.profilePicture,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = d.data_id) AS like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = d.data_id) AS comment_count
                 FROM 
                userdata d
                INNER JOIN 
                users u ON d.user_id = u.id
              ORDER BY 
                RAND()
              LIMIT 20;
        `
      , (err, results) => {
        if (err) {
            console.error("Error fetching videos:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

}
export function LoadPosts(app,db){
     // TODO:  load posts
      
      // Load posts for authenticated user
      app.get('/user/posts',verifyToken,  (req, res) => {
     //  const userId = req.user.id; // Extracted from token payload
      //console.log(userId);
        const query = `
                  
              SELECT 
                d.*, 
                u.name, 
                u.profilePicture,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = d.data_id) AS like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = d.data_id) AS comment_count
              FROM 
                userdata d
              INNER JOIN 
                users u ON d.user_id = u.id
              ORDER BY 
                RAND()
              LIMIT 20;
              `;
      
        db.query(query, [2], (err, results) => {
          if (err) {

            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
        return  res.status(200).json(results); // Send the query results as JSON
        });
      });

      app.get('/user/post/comments',  (req, res) => {
        //TODO fetch comments
        //  const userId = req.user.id; // Extracted from token payload
        const {id}=req.body;
         //console.log(userId);
           const query = `
                  SELECT 
                    comments.comment_id,
                    comments.user_id,
                    comments.content,
                    comments.commented_at,
                    users.name AS commenter_name,
                    users.profilePicture ,
                    
                    users.profilePicture AS commenter_profile
                  FROM 
                    comments
                  INNER JOIN 
                    users ON comments.user_id = users.id
                  WHERE 
                    comments.post_id = ?;

                 `;
         
           db.query(query, [id], (err, results) => {
             if (err) {
   
               console.error('Error executing query:', err);
               return res.status(500).json({ error: 'Internal Server Error' });
             }
             res.json(results); // Send the query results as JSON
           });
         });
         
         app.get('/user/post/likes',  (req, res) => {
          const {id}=req.body;
          //TODO  fetch likes
          //  const userId = req.user.id; // Extracted from token payload
        
           //console.log(userId);
             const query = `
              SELECT 
              likes.like_id,
              likes.user_id,
              users.name AS liker_name,
              users.profilePicture AS liker_profile,
              likes.liked_at
            FROM 
              likes
            INNER JOIN 
              users ON likes.user_id = users.id
            WHERE 
              likes.post_id = ?;
                        `;
           
             db.query(query, [id], (err, results) => {
               if (err) {
     
                 console.error('Error executing query:', err);
                 return res.status(500).json({ error: 'Internal Server Error' });
               }
               res.json(results); // Send the query results as JSON
             });
           });
      
}