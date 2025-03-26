import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import nodemailer from "nodemailer";
import crypto from "crypto";



import fs from "fs";
import { json } from "stream/consumers";
const firebaseConfig = {
    apiKey: "AIzaSyDbh8RFoVCUpINSmUCVcNsuSvU1T8M9yzY",

  authDomain: "fir-478f7.firebaseapp.com",

  projectId: "fir-478f7",

  storageBucket: "fir-478f7.appspot.com",

  messagingSenderId: "210781594621",

  appId: "1:210781594621:web:efc7697087a807e3f66f94",

  measurementId: "G-Z9G5D8EPP9"

};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: "gmail", // Use your email provider (e.g., Gmail, Outlook)
    auth: {
      user: "flambixtest@gmail.com", // Replace with your email
      pass: "0982782995apk+obb", // Replace with your email password or app password
    },
  });
  
  // Function to Send Email with Verification Code
  async function sendVerificationCode(email, code) {
    const mailOptions = {
      from: "flambixtest@gmail.com", // Sender address
      to: email, // Receiver email
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`, // Plain text body
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification code sent to ${email}`);
    } catch (error) {
      console.error("Error sending email:", error.message);
      throw error;
    }
  }
  
  const storage = getStorage(app);
export async function uploadFile(filePath,res,connection) {


    const fileData = fs.readFileSync(filePath); // Read file as Buffer
    const fileName = filePath.split("/").pop(); // Extract file name from path

    const storageRef = ref(storage, `uploads/${fileName}`);
    await uploadBytes(storageRef, fileData); // Upload the file buffer
    const downloadURL = await getDownloadURL(storageRef);
    //res.json({"Image Url: ":downloadURL});
    const sql = 'UPDATE users SET profilePicture=? WHERE id =?';

    connection.query(sql, [downloadURL,1], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    });
    res.status(200).json({ message: 'File uploaded successfully'});
    console.log('File available at:', downloadURL);
}


export async function uploadVideoToFire(filePath,res,connection,id) {
//TODO upload to firebase storage

  const fileData = fs.readFileSync(filePath); // Read file as Buffer
  const fileName = filePath.split("/").pop(); // Extract file name from path

  const storageRef = ref(storage, `videos/${fileName}`);
  await uploadBytes(storageRef, fileData); // Upload the file buffer
  const downloadURL = await getDownloadURL(storageRef);
  //res.json({"Image Url: ":downloadURL});
  const sql = `
  INSERT INTO userdata (user_id, content_type, content_url, created_at) VALUES (?, ?, ?, NOW());`;
  connection.query(sql, [id,'video',downloadURL], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return;
    }
    console.log('Data inserted successfully:', result);
  });
  res.status(200).json({ message: 'File uploaded successfully'});
  console.log('File available at:', downloadURL);
}




// Function to Sign Up a User
async function signUpUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send Verification Email
    await sendEmailVerification(user);
    console.log(`Verification email sent to ${email}`);
    return { message: "Sign-up successful. Please check your email to verify your account." };
  } catch (error) {
    console.error("Error signing up:", error.message);
    throw error;
  }
}

// Function to Sign In a User
async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      console.log("Email not verified. Please check your inbox.");
      return { error: "Email not verified." };
    }

    console.log("Sign-in successful:", user.email);
    return { message: "Sign-in successful", user };
  } catch (error) {
    console.error("Error signing in:", error.message);
    throw error;
  }
}

export { signUpUser, signInUser };


// Call the function with the correct file path


