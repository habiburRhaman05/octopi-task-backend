import mongoose from 'mongoose';

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(process.env.DATABASE_URL || '');

  console.log(`✅ MongoDB connected: ${connection.connection.host}`);

  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
