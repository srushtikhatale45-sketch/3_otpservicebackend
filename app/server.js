const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// ✅ Load env FIRST
dotenv.config({ path: path.join(__dirname, '../.env') });

// ✅ Load models AFTER env
require('./models/User');
require('./models/OTP');


const { connectDB, sequelize } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;


const corsOptions = {
  origin: ['http://localhost:5173','https://3-otpfrontend.vercel.app/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));
app.options('/', cors());
const authRoutes = require('./routes/authRoutes');
const smsRoutes = require('./routes/smsRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const startServer = async () => {
  const connected = await connectDB();

  if (connected) {
    await sequelize.sync(); // ✅ create tables
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
  });
};

startServer();