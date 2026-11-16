import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import authRouter from './routes/auth';
import competitionsRouter from './routes/competitions';
import schoolsRouter from './routes/schools';
import submissionsRouter from './routes/submissions';
import galleryRouter from './routes/gallery';
import physicalTrackingRouter from './routes/physicalTracking';
import certificatesRouter from './routes/certificates';
import auctionsRouter from './routes/auctions';
import adminRouter from './routes/admin';
import { errorHandler } from './middleware/validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Static uploads serving
app.use('/uploads', express.static(path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './uploads')));

// Healthcheck
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FOA Platform REST API v1'
  });
});

// Mount Routes under /api/v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/competitions', competitionsRouter);
app.use('/api/v1/schools', schoolsRouter);
app.use('/api/v1/submissions', submissionsRouter);
app.use('/api/v1/gallery', galleryRouter);
app.use('/api/v1/physical-tracking', physicalTrackingRouter);
app.use('/api/v1/certificates', certificatesRouter);
app.use('/api/v1', auctionsRouter);
app.use('/api/v1/admin', adminRouter);

// Central Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[FOA Platform API] Running on http://localhost:${PORT}/api/v1`);
  });
}

export default app;
