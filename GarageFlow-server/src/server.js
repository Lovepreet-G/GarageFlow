import express from 'express';
import cors from 'cors';


import authRoutes from './routes/authRoutes.js'
import invoiceRoutes from "./routes/invoiceRoutes.js"
import customerRoutes from "./routes/customerRoutes.js"
import vehicleRoutes from "./routes/vehicleRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import shopRoutes from "./routes/shopRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/invoices", invoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/shops", shopRoutes);



app.listen(5000, () => {
  console.log('GarageFlow API running on http://localhost:5000');
});
