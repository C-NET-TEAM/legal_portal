import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: ''
  },
  mimetype: {
    type: String,
    default: ''
  },
  filename: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    enum: ['cms', 'sms', 'system']
  },
  text: {
    type: String,
    default: ''
  },
  documents: [documentSchema],
  readByCms: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  }
}, { _id: false });

const caseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: String,
    default: 'N/A'
  },
  sex: {
    type: String,
    default: 'Not Specified'
  },
  city: {
    type: String,
    default: 'N/A'
  },
  state: {
    type: String,
    default: 'N/A'
  },
  details: {
    type: String,
    required: true
  },
  documents: [documentSchema],
  status: {
    type: String,
    default: 'Pending',
    index: true
  },
  category: {
    type: String,
    default: ''
  },
  targetSme: {
    type: String,
    default: ''
  },
  smsNotes: {
    type: String,
    default: ''
  },
  lexPrompt: {
    type: String,
    default: ''
  },
  lexOutput: {
    type: String,
    default: ''
  },
  finalFeedback: {
    type: String,
    default: ''
  },
  reviewerInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  chats: [chatSchema]
}, {
  timestamps: true
});

export default mongoose.model('Case', caseSchema);
