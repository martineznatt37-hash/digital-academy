require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

require('./db');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const courseRoutes = require('./routes/courses');
const tutoringRoutes = require('./routes/tutoring');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teachers');
const escapeRoutes = require('./routes/escape');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Panel admin del juego (solo con login de administrador)
app.get('/escape-admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'escape-admin.html'));
});
app.get('/escape-admin.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'escape-admin.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tutoring', tutoringRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/escape', escapeRoutes);

app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Digital Academy API running' });
});

function getNetworkCandidates() {
  const nets = os.networkInterfaces();
  const skip = /vmware|virtualbox|vethernet|hyper-v|wsl|loopback|bluetooth|vmnet|docker|npcap|virtual/i;
  const candidates = [];

  for (const [name, addrs] of Object.entries(nets)) {
    if (skip.test(name)) continue;
    for (const net of addrs || []) {
      const isV4 = net.family === 'IPv4' || net.family === 4;
      if (!isV4 || net.internal) continue;
      if (net.address.startsWith('169.254.')) continue;

      let priority = 0;
      if (/wi-?fi|wlan/i.test(name)) priority = 100;
      else if (/ethernet|eth/i.test(name)) priority = 80;
      else priority = 20;
      if (net.address.startsWith('192.168.')) priority += 10;
      if (net.address.startsWith('10.')) priority += 5;

      candidates.push({ name, address: net.address, priority });
    }
  }

  return candidates.sort((a, b) => b.priority - a.priority);
}

function getLocalIP() {
  return getNetworkCandidates()[0]?.address || 'localhost';
}

app.get('/api/mobile-url', (_req, res) => {
  const port = process.env.PORT || 3001;
  const candidates = getNetworkCandidates();
  const ip = candidates[0]?.address || 'localhost';
  const url = `http://${ip}:${port}`;
  const allUrls = candidates.map(c => ({
    url: `http://${c.address}:${port}`,
    ip: c.address,
    interface: c.name
  }));
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(url)}`;
  res.json({ url, qr, ip, port, interface: candidates[0]?.name || null, allUrls });
});

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`Digital Academy server running at http://localhost:${PORT}`);
  console.log(`Mobile access: http://${ip}:${PORT}`);
  console.log(`Demo account: demo@digitalacademy.com / demo1234`);
});
