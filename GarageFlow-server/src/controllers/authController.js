import { db } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerShop = async (req, res) => {
  const { name, email, password } = req.body;

   if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const hash = await bcrypt.hash(password, 10);


  await db.query(
    'INSERT INTO shops (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, hash]
  );

  res.json({ message: 'Shop registered' });
  res.send('GarageFlow API is running 🚗');
};

export const loginShop = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query('SELECT * FROM shops WHERE email = ?', [email]);

  if (!rows.length) return res.status(401).json({ message: 'Invalid login' });

  const shop = rows[0];
  const valid = await bcrypt.compare(password, shop.password_hash);

  if (!valid) return res.status(401).json({ message: 'Invalid login' });

  const token = jwt.sign({ shopId: shop.id }, process.env.JWT_SECRET);

  res.json({ token });
};
