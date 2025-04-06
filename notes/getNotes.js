export function GetNotes(app, db) {
    app.get("/api/notes", (req, res) => {
      const query = `SELECT * FROM note WHERE userId =?`;
     const userId =req.body;
      db.query(query,[userId], (err, results) => {
        if (err) {
          console.error("Error fetching notes:", err);
          return res.status(500).json({ error: "Database error", details: err });
        }
       // return  res.status(200).json(results);
        // Convert JSON fields back to objects
        const parsedResults = results.map(note => ({
          ...note,
          tasks: note.tasks ? note.tasks : null,
          codeBlocks: note.codeBlocks ? note.codeBlocks : null,
          mindMapData: note.mindMapData ? note.mindMapData : null,
        }));
  
      return  res.status(200).json(parsedResults);
      });
    });
  }
  