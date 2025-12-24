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
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/minigames';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      console.error(`❌ Error: User "${username}" not found`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  User "${username}" is already an admin`);
      await mongoose.disconnect();
      process.exit(0);
    }

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

