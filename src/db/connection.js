const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minigames';
    
    // Set connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error) {
    console.error('\n❌ MongoDB connection error:');
    console.error('   Error:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running locally, OR');
    console.error('   2. Set MONGODB_URI in .env file for MongoDB Atlas');
    console.error('   3. Create .env file with: MONGODB_URI=mongodb://localhost:27017/minigames');
    console.error('\n   For local MongoDB:');
    console.error('   - Windows: Start MongoDB service');
    console.error('   - Or download from: https://www.mongodb.com/try/download/community');
    console.error('\n   For MongoDB Atlas (cloud):');
    console.error('   - Sign up at: https://www.mongodb.com/cloud/atlas');
    console.error('   - Get connection string and add to .env file\n');
    process.exit(1);
  }
};

module.exports = connectDB;

