import express from 'express';
import mongoose from 'mongoose';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import User from './model/User.js';
import bcrypt from 'bcrypt';
import cors from 'cors'; // Optional

dotenv.config();

const app = express();
app.use(express.json());



// MongoDB connection
mongoose.connect(process.env.MONGODBURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

// Routes

app.get('/', (req, res) => {
  res.send({ message: 'API is running. Try /api/data or /api/login' });
});

app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "call summary"');
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    res.send({
      success: true,
      message: 'User authenticated',
      user: {
        email: user.email,
        firstname: user.firstname
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    res.status(201).send(saved);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

// Start the server
const PORT =5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
