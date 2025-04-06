export function UploadNotes(app, db) {
    app.post("/api/notes", (req, res) => {
        const notes = req.body;
      
        if (!Array.isArray(notes)) {
          return res.status(400).json({ error: "Expected an array of notes" });
        }
      
        const query = `
          INSERT INTO note
          (id,userId,title, content, timestamp, color, alarmTime, type, tasks, codeBlocks, mindMapData)
          VALUES ?`;
      
        const values = notes.map(note => [

       
          note.id,
          note.userId,
          note.title,
          note.content,
          note.timestamp,
          note.color,
          note.alarmTime,
          note.type,
          JSON.stringify(note.tasks),
          JSON.stringify(note.codeBlocks),
          JSON.stringify(note.mindMapData)
        ]);
      
        db.query(query, [values], (err, result) => {
          if (err) {
            console.error("Error in bulk insert:", err);
            return res.status(500).json({ error: "Database error", details: err });
          }
      
          res.status(201).json({ message: "Notes inserted", affectedRows: result.affectedRows });
        });
      });
      
  }
  