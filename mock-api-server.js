/**
 * Mock API Server for Local Development
 * Run with: node mock-api-server.js
 * Provides mock endpoints that were previously on letmetry.cloud
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const upload = multer({ dest: 'uploads/' });

// Mock data
const mockMuseums = [
  { id: 1, name: '故宫博物院', province: '北京', qualityGrade: '一级' },
  { id: 2, name: '上海博物馆', province: '上海', qualityGrade: '一级' },
  { id: 3, name: '陕西历史博物馆', province: '陕西', qualityGrade: '一级' }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Museum search
app.post('/museum/search', (req, res) => {
  const { museumName } = req.body;
  const matches = mockMuseums.filter(m => 
    m.name.includes(museumName) || museumName.includes(m.name)
  );
  
  res.json({
    success: true,
    museums: matches,
    count: matches.length
  });
});

// File upload
app.post('/image/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `http://localhost:3000/images/${req.file.filename}`;
  res.json({
    success: true,
    filename: req.file.filename,
    path: `/images/${req.file.filename}`,
    url: fileUrl
  });
});

// File list
app.get('/file/list', (req, res) => {
  try {
    const files = fs.readdirSync('uploads').map(file => ({
      filename: file,
      path: `/uploads/${file}`,
      url: `http://localhost:3000/uploads/${file}`
    }));
    res.json({ files });
  } catch (error) {
    res.json({ files: [] });
  }
});

// Mock MySQL endpoints
app.post('/mysql/query', (req, res) => {
  // Return empty result for now
  res.json([]);
});

app.post('/mysql/insert', (req, res) => {
  res.json({ success: true, id: Math.floor(Math.random() * 1000) });
});

app.post('/mysql/update', (req, res) => {
  res.json({ success: true, affected: 1 });
});

app.post('/mysql/delete', (req, res) => {
  res.json({ success: true, affected: 1 });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('uploads'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    console.log('📁 Created uploads directory');
  }
});
