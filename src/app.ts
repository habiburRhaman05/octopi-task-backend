import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import organizationRoutes from './routes/organizationRoutes';
import userRoutes from './routes/userRoutes';
import bookingRoutes from './routes/bookingRoutes';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRoutes);
  app.use('/organizations', organizationRoutes);
  app.use('/users', userRoutes);
  app.use('/bookings', bookingRoutes);


  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
