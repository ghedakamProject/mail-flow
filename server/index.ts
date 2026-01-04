import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import apiRoutes from './routes.js';
import { processCampaign } from './mailer.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// API Routes
app.use('/api', apiRoutes);

// Special route to start campaign (calls mailer logic)
app.post('/api/campaigns/:id/start', async (req, res) => {
    const { id } = req.params;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Non-blocking start
    processCampaign(id, baseUrl);

    res.json({ success: true, message: 'Campaign started' });
});

// Tracking Pixel (stub)
app.get('/api/track-email', (req, res) => {
    const { id, type } = req.query;
    console.log(`Tracking event: ${type} for log ${id}`);

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
    });
    res.end(pixel);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
