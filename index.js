import dotenv from 'dotenv';
import express from "express";
import bodyParser from "body-parser";
import db from "./db/db.js";
import axios from "axios";
//import pg from "pg";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from 'public' folder (CSS, client JS, images, etc.)
app.use(express.static('public'));

// Basic route to test server
app.get("/", async (req, res) => {
  try {
    // Example: fetch all books from DB to display on homepage
    const result = await db.query("SELECT * FROM books ORDER BY date_read DESC");
    res.render('index.ejs', { books: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// ADD a new book entry
app.get("/add", async (req,res) => {
  res.render("add.ejs");
});

app.post("/add", async (req,res) => {
  const title = req.body.title;
  const author = req.body.author;
  const rating = parseInt(req.body.rating, 10); // string? need to turn into int?
  const notes = req.body.notes;
  const date_read = req.body.date_read;
  const cover_url = `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`;

  try {
    await db.query("INSERT INTO books (title, author, rating, notes, date_read, cover_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
      [
        title, author, rating, notes, date_read, cover_url 
      ]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

// EDIT an existing post
app.get("/books/:id/edit", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query("SELECT * FROM books WHERE id = ($1)", [id]);
    const book = result.rows[0];
    res.render("edit.ejs", { book });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Failed to load edit page");
  }
});

// edit POST
app.post("/books/:id/edit", async (req, res) => {
  const id = req.params.id;
  const { title, author, rating, notes, date_read } = req.body;

  try {
    await db.query(`
      UPDATE books
      SET title = $1, author = $2, rating = $3, notes = $4, date_read = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6`,
      [title, author, rating, notes, date_read, id]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).send("Failed to update book");
  }

});

// DELETE an existing post
app.post("/books/:id/delete", async (req, res) => {
  const bookId = req.params.id;
  try {
    await db.query("DELETE FROM books WHERE id = $1", [bookId]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).send("Something went wrong while trying to delete the book.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});