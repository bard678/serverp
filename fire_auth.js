


function Register(app, db) {
  app.post('/register', async (req, res) => {
    const { name, account, password, profilePicture, email } = req.body;
    console.log("Reg.....")
    if (!name  || !password || !email) {
      return res.status(400).send('All fields are required');
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
          return res.status(400).send('Email is used by another user');
        }

        const hashedPassword = await bcryptjs.hash(password, 12); // More secure hash
        const verificationCode = generateVerificationCode(); // Generate a verification code

        const query = 'INSERT INTO users (id, name, email, profilePicture, password, verification_code) VALUES (UUID(), ?, ?, ?, ?, ?)';
        db.query(query, [name, email, profilePicture || null, hashedPassword, verificationCode], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error registering user');
          }

          sendVerificationEmail(email, verificationCode,res);
        
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });
}