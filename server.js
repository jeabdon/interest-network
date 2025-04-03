const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (in production, use a proper database)
let users = [];
let profiles = [];
let collections = [];
let bookmarks = [];

// Load data from file if exists
try {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    users = data.users || [];
    profiles = data.profiles || [];
    collections = data.collections || [];
    bookmarks = data.bookmarks || [];
} catch (error) {
    console.log('No existing data found, starting fresh');
}

// Save data to file
const saveData = () => {
    fs.writeFileSync('data.json', JSON.stringify({
        users,
        profiles,
        collections,
        bookmarks
    }));
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), email, password: hashedPassword, name };
    users.push(user);
    saveData();

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: user.id, email: user.email, name: user.name });
});

// Profile routes
app.get('/api/profiles', authenticateToken, (req, res) => {
    const userProfiles = profiles.filter(p => p.userId === req.user.id);
    res.json(userProfiles);
});

app.post('/api/profiles', authenticateToken, (req, res) => {
    const profile = { ...req.body, userId: req.user.id, id: Date.now().toString() };
    profiles.push(profile);
    saveData();
    res.json(profile);
});

app.put('/api/profiles/:id', authenticateToken, (req, res) => {
    const index = profiles.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Profile not found' });
    }
    profiles[index] = { ...profiles[index], ...req.body };
    saveData();
    res.json(profiles[index]);
});

app.delete('/api/profiles/:id', authenticateToken, (req, res) => {
    const index = profiles.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Profile not found' });
    }
    profiles.splice(index, 1);
    saveData();
    res.json({ success: true });
});

// Collection routes
app.get('/api/collections', authenticateToken, (req, res) => {
    const userCollections = collections.filter(c => c.userId === req.user.id);
    res.json(userCollections);
});

app.post('/api/collections', authenticateToken, (req, res) => {
    const collection = { ...req.body, userId: req.user.id, id: Date.now().toString() };
    collections.push(collection);
    saveData();
    res.json(collection);
});

app.put('/api/collections/:id', authenticateToken, (req, res) => {
    const index = collections.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Collection not found' });
    }
    collections[index] = { ...collections[index], ...req.body };
    saveData();
    res.json(collections[index]);
});

app.delete('/api/collections/:id', authenticateToken, (req, res) => {
    const index = collections.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Collection not found' });
    }
    collections.splice(index, 1);
    saveData();
    res.json({ success: true });
});

// Bookmark routes
app.get('/api/bookmarks', authenticateToken, (req, res) => {
    const userBookmarks = bookmarks.filter(b => b.userId === req.user.id);
    res.json(userBookmarks);
});

app.post('/api/bookmarks', authenticateToken, (req, res) => {
    const bookmark = { ...req.body, userId: req.user.id, id: Date.now().toString() };
    bookmarks.push(bookmark);
    saveData();
    res.json(bookmark);
});

app.put('/api/bookmarks/:id', authenticateToken, (req, res) => {
    const index = bookmarks.findIndex(b => b.id === req.params.id && b.userId === req.user.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }
    bookmarks[index] = { ...bookmarks[index], ...req.body };
    saveData();
    res.json(bookmarks[index]);
});

app.delete('/api/bookmarks/:id', authenticateToken, (req, res) => {
    const index = bookmarks.findIndex(b => b.id === req.params.id && b.userId === req.user.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }
    bookmarks.splice(index, 1);
    saveData();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 