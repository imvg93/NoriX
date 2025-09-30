import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

// MongoDB connection options for security and performance
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: 'majority' as const,
  autoIndex: false, // Disable automatic index creation to prevent duplicates
  // SSL options for MongoDB Atlas
  ...(MONGODB_URI.includes('mongodb+srv://') && {
    ssl: true,
  }),
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    // Disable automatic index creation globally
    mongoose.set('autoIndex', false);
    
    await mongoose.connect(MONGODB_URI, options);
    
    // Clean up duplicate indexes after connection
    await cleanupDuplicateIndexes();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Function to clean up duplicate indexes
const cleanupDuplicateIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const getErrorMessage = (error: unknown): string => {
      if (error instanceof Error) return error.message;
      return typeof error === 'string' ? error : JSON.stringify(error);
    };

    // List of problematic indexes to specifically target
    const problematicIndexes = [
      { collection: 'users', field: 'companyName' },
      { collection: 'users', field: 'city' },
      { collection: 'jobs', field: 'companyName' },
      { collection: 'jobs', field: 'city' }
    ];

    // Drop specific problematic indexes
    for (const { collection, field } of problematicIndexes) {
      try {
        const coll = db.collection(collection);
        const indexes = await coll.indexes();
        
        const indexesToDrop = indexes.filter(index => {
          const indexName = typeof index.name === 'string' ? index.name : '';
          if (indexName === '_id_') return false;
          const key = index.key ?? {};
          return indexName.includes(field) || Object.prototype.hasOwnProperty.call(key, field);
        });
        
        for (const index of indexesToDrop) {
          const indexName = typeof index.name === 'string' ? index.name : undefined;
          if (!indexName) continue;
          try {
            await coll.dropIndex(indexName);
            console.log(`🗑️ Dropped problematic index: ${collection}.${indexName}`);
          } catch (err) {
            console.log(`⚠️ Could not drop index ${indexName}: ${getErrorMessage(err)}`);
          }
        }
      } catch (err) {
        console.log(`⚠️ Collection ${collection} might not exist yet: ${getErrorMessage(err)}`);
      }
    }

    // Get all collections and check for general duplicates
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      
      // Get all indexes for this collection
      const indexes = await coll.indexes();
      
      // Check for duplicate indexes (same key pattern)
      const indexKeys = new Map<string, string>();
      const duplicates: string[] = [];
      
      for (const index of indexes) {
        const indexName = typeof index.name === 'string' ? index.name : undefined;
        if (!indexName || indexName === '_id_') continue;
        
        const keyStr = JSON.stringify(index.key ?? {});
        if (indexKeys.has(keyStr)) {
          duplicates.push(indexName);
        } else {
          indexKeys.set(keyStr, indexName);
        }
      }
      
      // Drop duplicate indexes
      for (const duplicateIndex of duplicates) {
        try {
          await coll.dropIndex(duplicateIndex);
          console.log(`🗑️ Dropped duplicate index: ${collection.name}.${duplicateIndex}`);
        } catch (err) {
          console.log(`⚠️ Could not drop index ${duplicateIndex}: ${getErrorMessage(err)}`);
        }
      }
    }
    
    console.log('✅ Index cleanup completed');
  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
  }
};

// Function to ensure required indexes are created (disabled to prevent conflicts)
const ensureRequiredIndexes = async (): Promise<void> => {
  try {
    // Temporarily disable automatic index creation to prevent conflicts
    // Models will be imported later and indexes will be created on demand
    console.log('✅ Index creation deferred to prevent conflicts');
  } catch (error) {
    console.error('❌ Error in index management:', error);
  }
};

// Disconnect from MongoDB
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

export default mongoose;
