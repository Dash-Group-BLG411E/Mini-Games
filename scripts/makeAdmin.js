/**
 * Simple script to promote a user to admin role
 * 
 * Usage: node scripts/makeAdmin.js <username>
 * 
 * Example: node scripts/makeAdmin.js john
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const username = process.argv[2];

if (!username) {
  console.error('❌ Error: Username is required');
  console.log('Usage: node scripts/makeAdmin.js <username>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/minigames';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      console.error(`❌ Error: User "${username}" not found`);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === 'admin') {
      console.log(`ℹ️  User "${username}" is already an admin`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Promote to admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ Successfully promoted "${username}" to admin role`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();

