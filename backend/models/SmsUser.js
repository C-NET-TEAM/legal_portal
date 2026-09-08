import mongoose from 'mongoose';

const smsUserSchema = new mongoose.Schema({
  smsId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  firstName: {
    type: String,
    default: 'Specialist',
    trim: true
  },
  middleName: {
    type: String,
    default: '',
    trim: true
  },
  lastName: {
    type: String,
    default: '',
    trim: true
  },
  position: {
    type: String,
    default: '',
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('SmsUser', smsUserSchema);
