const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Get all todos ───────────────────────────────────

app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /todos error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Create a todo ───────────────────────────────────

app.post('/todos', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /todos error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Toggle todo completion ──────────────────────────

app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE todos SET completed = NOT completed WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /todos/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete a todo ───────────────────────────────────

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted', todo: result.rows[0] });
  } catch (err) {
    console.error('DELETE /todos/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Start server ────────────────────────────────────

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
