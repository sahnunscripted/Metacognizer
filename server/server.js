import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route imports
import authRouter from './routes/auth.js';
import actionsRouter from './routes/actions.js';
import projectsRouter from './routes/projects.js';
import braindumpRouter from './routes/braindump.js';
import inbasketRouter from './routes/inbasket.js';
import somedayRouter from './routes/someday.js';
import statsRouter from './routes/stats.js';
import recurringActionsRouter from './routes/recurringActions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/braindump', braindumpRouter);
app.use('/api/inbasket', inbasketRouter);
app.use('/api/someday', somedayRouter);
app.use('/api/stats', statsRouter);
app.use('/api/recurring-actions', recurringActionsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the production build
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
