


import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile, uploadVideoToFire } from './storage.js';
import { authenticateToken } from './home_page.js';
import { verifyToken } from './srcc/middlewares/authMiddleware.js';


// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be saved in the 'uploads' directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
   
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be saved in the 'uploads' directory
    cb(null, 'videos/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${path.basename(file.originalname, path.extname(file.originalname))}.mp4`;

    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });
const uploadVideo = multer({ storage: videoStorage });

export function UploadImage (app,db){

     // TODO: get image  from api request
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
      }
    app.post('/upload', upload.single('file'), (req, res) => {
        try {
          const file = req.file;
      
          if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
          }
      
          console.log(`File received: ${file.originalname}`);
          console.log(`File stored at: ${file.path}`);
          // TODO: upload image  to firebase storage

           uploadFile(file.path,res,db);
          // Optionally process or store the file further (e.g., upload to Firebase Storage)
         
        } catch (error) {
          console.error('Error while uploading file:', error);
         
        }
       
   //
      });
      
}

export function UploadReel (app,db){

  // TODO: get image  from api request
 if (!fs.existsSync('videos')) {
     fs.mkdirSync('videos');
   }
 app.post('/upload/reels',verifyToken, uploadVideo.single('video'), (req, res) => {
     try {
      const id =req.user.id;
       const file = req.file;
   
       if (!file) {
         return res.status(400).json({ message: 'No Video uploaded' });
       }
   
       console.log(`Video received: ${file.originalname}`);
       console.log(`Video stored at: ${file.path}`);
       // TODO: upload image  to firebase storage
        console.log(id);
       uploadVideoToFire(file.path,res,db,id);
       // Optionally process or store the file further (e.g., upload to Firebase Storage)
      
     } catch (error) {
       console.error('Error while uploading file:', error);
      
     }
    
//
   });
   
}


