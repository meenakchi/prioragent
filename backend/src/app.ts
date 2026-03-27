import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { auth } from 'express-openid-connect';
import { auth0Config } from './config/auth0';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import ehrRoutes from './routes/ehr.routes';
import priorAuthRoutes from './routes/priorauth.routes';
import tokenVaultRoutes from './routes/tokenVault.routes';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(auth(auth0Config));

app.use('/api/auth', authRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/prior-auth', priorAuthRoutes);
app.use('/api/token-vault', tokenVaultRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'PriorAgent' }));

app.use(errorMiddleware);

export default app;