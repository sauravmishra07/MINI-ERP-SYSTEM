import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { serverConfig } from './config';
import { authConfig } from './config/auth.config';
import v1Router from './routers/v1/index.router';
import v2Router from './routers/v2/index.router';
import { appErrorHandler, genericErrorHandler } from './middlewares/error.middleware';
import logger from './config/logger.config';
import { attachCorrelationIdMiddleware } from './middlewares/correlation.middleware';
import passport from './config/passport';

const app = express();

// Accept requests from the configured frontend URL, any Vercel preview
// deployment for this project, and localhost for local development.
const ALLOWED_ORIGINS = [
  authConfig.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
];

const VERCEL_PATTERN = /^https:\/\/mini-erp-system-[a-z0-9]+-sauravmishra07s-projects\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin) || VERCEL_PATTERN.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json()); 
app.use(cookieParser());
app.use(passport.initialize());

/**
 * Registering all the routers and their corresponding routes with out app server object.
 */

app.use(attachCorrelationIdMiddleware);
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router); 


/**
 * Add the error handler middleware
 */

app.use(appErrorHandler);
app.use(genericErrorHandler);


app.listen(serverConfig.PORT, () => {
    logger.info(`Server is running on http://localhost:${serverConfig.PORT}`);
    logger.info(`Press Ctrl+C to stop the server.`);
});
