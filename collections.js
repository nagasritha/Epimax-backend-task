
const mongoose = require('mongoose');

// Schema for Tasks collection
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'pending']
  },
  assignee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Schema for Users collection
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password_hash: {
    type: String,
    required: true
  }
});

// Created models for Tasks and Users collections
const Task = mongoose.model('Task', taskSchema);
const User = mongoose.model('User', userSchema);

// Export models
module.exports = {
  Task,
  User
};
