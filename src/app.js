import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.js';
import { flatsTable, supabase } from './config/supabase.js';
import { listingsRouter } from './routes/listings.js';
import { uploadRouter } from './routes/upload.js';
import { messagesRouter } from './routes/messages.js';

const app = express();

const allowedOrigins = (process.env.APP_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin header
      // and allow all origins if APP_ORIGINS is not configured.
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('This origin is not allowed by CORS.'));
    },
  }),
);

// JSON body
app.use(express.json({ limit: '10mb' }));

// Logger
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'),
);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});

// Flats
app.get('/api/flats', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from(flatsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Flats error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/messages', messagesRouter);

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found.',
  });
});

// Global error handler
app.use((error, _req, res, _next) => {
  console.error('Global server error:', error);

  res.status(error.statusCode || 500).json({
    error: error.statusCode
      ? error.message
      : 'An unexpected server error occurred.',
  });
});

// IMPORTANT FOR VERCEL
export default app;