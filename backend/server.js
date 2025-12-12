const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios'); // Add axios
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categories');
const sliderRoutes = require('./routes/sliderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// ✅ FIXED CORS Configuration
const allowedOrigins = [
  'https://artplazza.netlify.app',
  'http://localhost:3000',
  // Optional: add more if needed
  process.env.FRONTEND_URL 
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in allowed list
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.startsWith(allowedOrigin.replace(/\/$/, ''))
    )) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// ✅ Add preflight request handling
app.options('*', cors());

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Art plazaa  Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    allowedOrigins: allowedOrigins
  });
});

// Additional keep-alive endpoint
app.get('/api/keep-alive', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is awake!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/slider', sliderRoutes);
app.use('/api/auth', authRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Error:', error);

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: true,
      message: 'Duplicate field value entered',
      field: Object.keys(error.keyPattern)[0]
    });
  }

  // CORS errors
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: error.message,
      allowedOrigins: allowedOrigins
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://artplazza.netlify.app'}`);
  console.log(`✅ Allowed CORS origins:`, allowedOrigins);
  
  // Start keep-alive function after server starts
  startKeepAlive();
});

// Function to ping server and keep it awake (for Render free tier)
function startKeepAlive() {
  const url = process.env.RENDER_EXTERNAL_URL || `https://artweb-fmna.onrender.com` || `http://localhost:${PORT}`;
  const interval = 14 * 60 * 1000; // 14 minutes (Render spins down after 15 mins)
  
  console.log(`🔄 Setting up keep-alive for: ${url}`);
  console.log(`⏰ Interval: ${interval / 1000} seconds`);

  // Initial ping
  pingServer(url);

  // Set up interval for pinging
  const keepAliveInterval = setInterval(() => {
    pingServer(url);
  }, interval);
  
  // Also ping more frequently in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      pingServer(`http://localhost:${PORT}`);
    }, 60000); // Every minute in development
  }

  return keepAliveInterval;
}

// Function to ping the server
function pingServer(url) {
  const pingUrl = `${url}/api/keep-alive`;
  
  axios.get(pingUrl)
    .then(response => {
      console.log(`✅ Keep-alive ping successful at ${new Date().toLocaleTimeString()}`);
      console.log(`   Status: ${response.data.message}`);
    })
    .catch(error => {
      console.error(`❌ Keep-alive ping failed at ${new Date().toLocaleTimeString()}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Message: ${error.response.data?.message || 'No response data'}`);
      } else if (error.request) {
        console.error(`   No response received: ${error.message}`);
      } else {
        console.error(`   Request setup error: ${error.message}`);
      }
    });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});