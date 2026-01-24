/**
 * Mock API Server for Local Development
 * Run with: node scripts/mock-api-server.js
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

// Mock achievement posters data
const mockAchievementPosters = [
  {
    id: 1,
    image_url: 'assets/images/MuseumCheck_logo.jpg',
    title: '我的第一个博物馆成就',
    user_name: '小淘气',
    museum_id: '1',
    created_at: '2026-01-20T10:30:00Z'
  },
  {
    id: 2,
    image_url: 'assets/images/MuseumCheck_logo.jpg',
    title: '故宫博物院探险记',
    user_name: '咚咚',
    museum_id: '1',
    created_at: '2026-01-21T14:15:00Z'
  },
  {
    id: 3,
    image_url: 'assets/images/MuseumCheck_logo.jpg',
    title: '上海博物馆奇妙日',
    user_name: '小明',
    museum_id: '2',
    created_at: '2026-01-22T09:45:00Z'
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Leaderboard endpoint (mocking AWS API)
app.get('/default/leaderboard', (req, res) => {
  console.log('[Mock API] Returning leaderboard data');
  res.json({
    items: [
      { nickname: '小淘气', visits: 3 },
      { nickname: '咚咚', visits: 2 },
      { nickname: '用户123', visits: 2 },
      { nickname: '小明', visits: 1 },
      { nickname: '小红', visits: 1 }
    ]
  });
});

// Image search endpoint
app.post('/image/search', (req, res) => {
  const { keyword, count = 10 } = req.body;
  console.log('[Mock API] Image search for:', keyword, 'count:', count);
  
  // Mock image search results
  const mockImages = [
    {
      url: 'assets/images/MuseumCheck_logo.jpg',
      title: `${keyword}相关图片1`,
      description: `这是关于${keyword}的博物馆图片`,
      source: 'mock-api'
    },
    {
      url: 'assets/images/MuseumCheck_logo.jpg', 
      title: `${keyword}相关图片2`,
      description: `这是${keyword}的文物图片`,
      source: 'mock-api'
    },
    {
      url: 'assets/images/MuseumCheck_logo.jpg',
      title: `${keyword}相关图片3`,
      description: `这是${keyword}的历史图片`,
      source: 'mock-api'
    }
  ];
  
  // Return requested number of images
  const results = mockImages.slice(0, Math.min(count, mockImages.length));
  
  res.json({
    success: true,
    images: results,
    count: results.length,
    keyword: keyword
  });
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
  const { sql } = req.body;
  
  // Check if this is an achievement posters query
  if (sql && sql.includes('achievement_posters')) {
    console.log('[Mock API] Achievement posters query detected:', sql);
    console.log('[Mock API] Returning achievement posters data:', mockAchievementPosters.length, 'items');
    res.json(mockAchievementPosters);
    return;
  }
  
  // Default empty result for other queries
  console.log('[Mock API] Empty result for query:', sql);
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
