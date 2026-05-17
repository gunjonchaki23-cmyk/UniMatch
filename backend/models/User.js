const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^.+@student\.aiub\.edu$/, 'Please use a valid AIUB student email address (@student.aiub.edu)']
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  interestedIn: {
    type: String,
    enum: ['Male', 'Female', 'Both'],
  },
  studentId: {
    type: String,
    match: [/^\d{2}-\d{5}-\d$/, 'Please use a valid AIUB Student ID format (e.g., 21-45678-3)']
  },
  batch: {
    type: String,
  },
  department: {
    type: String,
    enum: ['CSE', 'EEE', 'BBA', 'Architecture', 'English', 'LLB', 'Other'],
  },
  campusSpots: {
    type: [String],
    default: [],
  },
  interests: {
    type: [String],
    default: [],
  },
  prompts: [{
    question: { type: String },
    answer: { type: String }
  }],
  bio: {
    type: String,
    default: '',
    maxLength: 500,
  },
  photos: {
    type: [String],
    default: [],
  },
  coverPhoto: {
    type: String,
    default: '',
  },
  freeSlots: {
    type: [String],
    default: [],
  },
  musicAnthem: {
    title: { type: String, default: '' },
    artist: { type: String, default: '' }
  },
  admires: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    promptQuestion: { type: String },
    comment: { type: String }
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (this.isModified('studentId') && this.studentId) {
    const parts = this.studentId.split('-');
    if (parts[0] && parts[0].length === 2) {
      this.batch = `20${parts[0]} Batch`;
    }
  }

  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
