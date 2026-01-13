import express from 'express';
import cors from 'cors';


import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GarageFlow API is running 🚗');
});

app.use('/api/auth', authRoutes);
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});

app.listen(5000, () => {
  console.log('API running on http://localhost:5000');
});
