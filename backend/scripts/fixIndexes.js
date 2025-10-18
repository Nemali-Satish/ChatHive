import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the problematic username index if it exists
    try {
      await usersCollection.dropIndex('username_1');
      console.log('✅ Dropped username_1 index');
    } catch (error) {
      console.log('ℹ️  username_1 index does not exist or already dropped');
    }

    // List indexes after cleanup
    const newIndexes = await usersCollection.indexes();
    console.log('Indexes after cleanup:', newIndexes);

    console.log('✅ Index cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixIndexes();
