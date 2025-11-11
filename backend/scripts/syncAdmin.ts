import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User';

dotenv.config();

const ADMIN_EMAIL = 'mework2003@gmail.com';
const ADMIN_PASSWORD = 'admin1234';

async function syncAdminUser() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Neither MONGO_URI nor MONGODB_URI is defined in the environment');
  }

  await mongoose.connect(mongoUri);

  try {
    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    await User.updateOne(
      { email: ADMIN_EMAIL },
      {
        $set: {
          name: 'Norix Admin',
          email: ADMIN_EMAIL,
          phone: '9999999999',
          password: hashedPassword,
          userType: 'admin',
          role: 'admin',
          isActive: true,
          emailVerified: true,
          status: 'approved',
          submittedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log('✅ Admin user is synced. You can log in with the provided credentials.');
  } finally {
    await mongoose.disconnect();
  }
}

syncAdminUser().catch((error) => {
  console.error('❌ Failed to sync admin user:', error);
  process.exit(1);
});

