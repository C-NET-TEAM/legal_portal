import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import User from './models/User.js';
import SmsUser from './models/SmsUser.js';
import Case from './models/Case.js';
import Alert from './models/Alert.js';
import { upload, UPLOAD_DIR, processDocuments } from './upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend applications
app.use(cors());

// Parse JSON bodies (increased limit to accept legacy Base64 file payloads and convert to EBS storage)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file server for EBS uploaded media files
app.use('/api/uploads', express.static(UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  return res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ebsUploadDir: UPLOAD_DIR,
    database: 'MongoDB Atlas'
  });
});

// ================= FILE UPLOAD ROUTE (EBS DISK STORAGE) =================
// Direct multipart/form-data upload route
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const uploadedDocuments = req.files.map(file => {
      const sizeMB = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      return {
        name: file.originalname,
        size: sizeMB,
        mimetype: file.mimetype,
        filename: file.filename,
        url: `/api/uploads/${file.filename}`,
        uploadedAt: new Date()
      };
    });

    return res.json({ success: true, files: uploadedDocuments });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Failed to process file upload.' });
  }
});

// ================= AUTH ROUTES =================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { clientId, name, password } = req.body;
    if (!clientId || !name || !password) {
      return res.status(400).json({ error: 'Client ID, Name, and Password are required.' });
    }

    const existing = await User.findOne({ clientId: new RegExp(`^${clientId.trim()}$`, 'i') });
    if (existing) {
      return res.status(400).json({ error: 'Client ID already exists. Please choose another or log in.' });
    }

    const newUser = await User.create({
      clientId: clientId.trim(),
      name: name.trim(),
      password
    });

    return res.json({ success: true, user: { clientId: newUser.clientId, name: newUser.name } });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { clientId, password } = req.body;
    if (!clientId || !password) {
      return res.status(400).json({ error: 'Client ID and Password are required.' });
    }

    const user = await User.findOne({
      clientId: new RegExp(`^${clientId.trim()}$`, 'i'),
      password
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid Client ID or Password.' });
    }

    return res.json({ success: true, user: { clientId: user.clientId, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { clientId, oldPassword, newPassword } = req.body;
    if (!clientId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const user = await User.findOne({ clientId: new RegExp(`^${clientId.trim()}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.password !== oldPassword) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { clientId, newPassword } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required.' });
    }

    const user = await User.findOne({ clientId: new RegExp(`^${clientId.trim()}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'Client ID not registered.' });
    }

    user.password = newPassword || 'cms12345';
    await user.save();
    return res.json({ success: true, message: 'Password reset successfully. Temporary password set.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ================= SMS AUTH ROUTES =================
app.post('/api/sms/auth/register', async (req, res) => {
  try {
    const { smsId, password, position } = req.body;
    if (!smsId || !password) {
      return res.status(400).json({ error: 'SMS ID and Password are required.' });
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters and contain letters, numbers, and symbols.'
      });
    }

    const existing = await SmsUser.findOne({ smsId: new RegExp(`^${smsId.trim()}$`, 'i') });
    if (existing) {
      const num1 = Math.floor(100 + Math.random() * 900);
      const num2 = Math.floor(1000 + Math.random() * 9000);
      return res.status(400).json({
        error: 'SMS ID already exists.',
        suggestions: [`${smsId}${num1}`, `${smsId}_${num2}`]
      });
    }

    const newUser = await SmsUser.create({
      smsId: smsId.trim(),
      firstName: 'Specialist',
      middleName: '',
      lastName: smsId.trim(),
      position: position || '',
      password,
      profileImage: null
    });

    return res.json({ success: true, user: newUser });
  } catch (err) {
    console.error('SMS Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/sms/auth/login', async (req, res) => {
  try {
    const { smsId, password } = req.body;
    if (!smsId || !password) {
      return res.status(400).json({ error: 'SMS ID and Password are required.' });
    }

    const user = await SmsUser.findOne({
      smsId: new RegExp(`^${smsId.trim()}$`, 'i'),
      password
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid SMS ID or Password.' });
    }

    return res.json({
      success: true,
      user: {
        smsId: user.smsId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        position: user.position,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    console.error('SMS Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/sms/auth/change-password', async (req, res) => {
  try {
    const { smsId, oldPassword, newPassword } = req.body;
    if (!smsId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'SMS ID, old password, and new password are required.' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters and contain letters, numbers, and symbols.'
      });
    }

    const user = await SmsUser.findOne({ smsId: new RegExp(`^${smsId.trim()}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'SMS User not found.' });
    }

    if (user.password !== oldPassword) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('SMS Change password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ================= CASES ROUTES =================
app.get('/api/cases', async (req, res) => {
  try {
    const { clientId } = req.query;
    const filter = clientId ? { clientId: new RegExp(`^${clientId.trim()}$`, 'i') } : {};
    const cases = await Case.find(filter).sort({ createdAt: -1 });
    return res.json(cases);
  } catch (err) {
    console.error('Get cases error:', err);
    return res.status(500).json({ error: 'Failed to fetch cases.' });
  }
});

app.get('/api/cases/:id', async (req, res) => {
  try {
    const caseItem = await Case.findOne({ id: req.params.id });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found.' });
    }
    return res.json(caseItem);
  } catch (err) {
    console.error('Get case by ID error:', err);
    return res.status(500).json({ error: 'Failed to fetch case.' });
  }
});

// CMS Submit New Case
app.post('/api/cases', async (req, res) => {
  try {
    const {
      id,
      clientId,
      clientName,
      age,
      sex,
      city,
      state,
      details,
      documents,
      category,
      targetSme
    } = req.body;

    if (!clientName || !details) {
      return res.status(400).json({ error: 'Name and Case Details are required.' });
    }

    // Process documents: convert any Base64 strings to EBS disk files
    const processedDocs = processDocuments(documents || []);

    const caseNumber = Math.floor(1000 + Math.random() * 9000);
    const caseId = id || `CASE-${caseNumber}`;

    const newCase = await Case.create({
      id: caseId,
      clientId: clientId || 'GUEST',
      clientName,
      age: age || 'N/A',
      sex: sex || 'Not Specified',
      city: city || 'N/A',
      state: state || 'N/A',
      details,
      documents: processedDocs,
      status: 'Pending',
      category: category || '',
      targetSme: targetSme || '',
      smsNotes: '',
      lexPrompt: '',
      lexOutput: '',
      finalFeedback: '',
      chats: []
    });

    return res.json({ success: true, case: newCase });
  } catch (err) {
    console.error('Create case error:', err);
    return res.status(500).json({ error: 'Failed to submit case.' });
  }
});

// SMS Specialist Reviews & Approves Case
app.post('/api/cases/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, category, smsNotes, lexPrompt, reviewerInfo } = req.body;

    const caseItem = await Case.findOne({ id });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    caseItem.status = status || 'Approved';
    if (category) caseItem.category = category;
    if (smsNotes !== undefined) caseItem.smsNotes = smsNotes;
    if (lexPrompt !== undefined) caseItem.lexPrompt = lexPrompt;
    if (reviewerInfo) caseItem.reviewerInfo = reviewerInfo;

    await caseItem.save();

    // Create notification alert for CMS client
    const alertCount = await Alert.countDocuments();
    const alertId = `ALT-${(alertCount + 1).toString().padStart(2, '0')}`;
    const newAlert = await Alert.create({
      id: alertId,
      caseId: id,
      title: `SMS Reply on ${id}: ${caseItem.status}`,
      message: smsNotes || `Your case ${id} has been reviewed by SMS.`,
      structuredData: {
        caseId: id,
        clientName: caseItem.clientName,
        status: caseItem.status,
        category: caseItem.category,
        smsNotes: caseItem.smsNotes,
        lexPrompt: caseItem.lexPrompt,
        reviewerInfo: caseItem.reviewerInfo
      },
      read: false
    });

    return res.json({ success: true, case: caseItem, alert: newAlert });
  } catch (err) {
    console.error('Case review error:', err);
    return res.status(500).json({ error: 'Failed to review case.' });
  }
});

// CMS Submits Lex AI Output to SMS
app.post('/api/cases/:id/lex-output', async (req, res) => {
  try {
    const { id } = req.params;
    const { lexOutput } = req.body;

    const caseItem = await Case.findOne({ id });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    caseItem.lexOutput = lexOutput;
    caseItem.status = 'AI Output Submitted';
    await caseItem.save();

    return res.json({ success: true, case: caseItem });
  } catch (err) {
    console.error('Lex output submit error:', err);
    return res.status(500).json({ error: 'Failed to submit Lex AI output.' });
  }
});

// SMS Final Review on Lex AI Output (Approved or Sudhar / Revisions)
app.post('/api/cases/:id/final-review', async (req, res) => {
  try {
    const { id } = req.params;
    const { finalStatus, finalFeedback, revisedPrompt, reviewerInfo } = req.body;

    const caseItem = await Case.findOne({ id });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    caseItem.status = finalStatus || 'Completed';
    caseItem.finalFeedback = finalFeedback || '';
    if (revisedPrompt) caseItem.lexPrompt = revisedPrompt;
    if (reviewerInfo) caseItem.reviewerInfo = reviewerInfo;

    await caseItem.save();

    // Create alert for CMS
    const alertCount = await Alert.countDocuments();
    const alertId = `ALT-${(alertCount + 1).toString().padStart(2, '0')}`;
    const newAlert = await Alert.create({
      id: alertId,
      caseId: id,
      title: `Final SMS Feedback: ${caseItem.status}`,
      message: finalFeedback || `SMS has completed final evaluation for ${id}.`,
      structuredData: {
        caseId: id,
        status: caseItem.status,
        category: caseItem.category,
        smsNotes: caseItem.finalFeedback,
        lexPrompt: caseItem.lexPrompt,
        reviewerInfo: caseItem.reviewerInfo
      },
      read: false
    });

    return res.json({ success: true, case: caseItem, alert: newAlert });
  } catch (err) {
    console.error('Final review error:', err);
    return res.status(500).json({ error: 'Failed to submit final review.' });
  }
});

// Chat Endpoint (CMS & SMS)
app.post('/api/cases/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, text, documents } = req.body;

    const caseItem = await Case.findOne({ id });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Process attached documents to EBS storage
    const processedDocs = processDocuments(documents || []);

    const newMessage = {
      sender,
      text: text || '',
      documents: processedDocs,
      readByCms: sender === 'cms',
      timestamp: new Date().toISOString()
    };

    caseItem.chats.push(newMessage);
    await caseItem.save();

    // If sender is SMS, generate a real-time notification alert for CMS
    if (sender === 'sms') {
      const alertCount = await Alert.countDocuments();
      const newAlert = await Alert.create({
        id: `ALT-${Date.now().toString().slice(-4)}${alertCount + 1}`,
        caseId: id,
        title: `SMS Reply on ${id}: ${caseItem.status === 'Approved' ? 'Under Review' : caseItem.status}`,
        message: text || (processedDocs.length > 0 ? `Sent ${processedDocs.length} attachment(s)` : 'New reply from specialist'),
        structuredData: {
          caseId: id,
          clientName: caseItem.clientName,
          status: caseItem.status,
          category: caseItem.category,
          smsNotes: text,
          reviewerInfo: caseItem.reviewerInfo
        },
        read: false
      });
    }

    return res.json({ success: true, case: caseItem, message: newMessage });
  } catch (err) {
    console.error('Send chat error:', err);
    return res.status(500).json({ error: 'Failed to send chat message.' });
  }
});

// Mark all alerts & chats for a case as read
app.post('/api/cases/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;

    await Alert.updateMany({ caseId: id }, { read: true });

    const caseItem = await Case.findOne({ id });
    if (caseItem && caseItem.chats) {
      caseItem.chats.forEach(ch => {
        ch.readByCms = true;
      });
      await caseItem.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to mark case read.' });
  }
});

// Complete Case Endpoint (SMS Only)
app.post('/api/cases/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { smsId, password } = req.body;

    const smsUser = await SmsUser.findOne({
      smsId: new RegExp(`^${smsId.trim()}$`, 'i'),
      password
    });

    if (!smsUser) {
      return res.status(401).json({ error: 'Invalid SMS ID or Password.' });
    }

    const caseItem = await Case.findOne({ id });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    caseItem.status = 'Completed';
    await caseItem.save();

    return res.json({ success: true, case: caseItem });
  } catch (err) {
    console.error('Complete case error:', err);
    return res.status(500).json({ error: 'Failed to complete case.' });
  }
});

// ================= ALERTS ROUTES =================
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    return res.json(alerts);
  } catch (err) {
    console.error('Get alerts error:', err);
    return res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

app.post('/api/alerts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await Alert.findOneAndUpdate({ id }, { read: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('Alert mark read error:', err);
    return res.status(500).json({ error: 'Failed to update alert.' });
  }
});

app.post('/api/alerts/mark-all-read', async (req, res) => {
  try {
    await Alert.updateMany({}, { read: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('Alerts mark all read error:', err);
    return res.status(500).json({ error: 'Failed to mark all alerts read.' });
  }
});

// ================= SERVER START =================
function getNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function startServer() {
  try {
    // Connect to MongoDB Atlas first
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      const lanIp = getNetworkIp();
      console.log(`\n======================================================`);
      console.log(`  CMS-SMS BACKEND SERVER RUNNING (MONGODB + AWS EBS)`);
      console.log(`  Local:   http://localhost:${PORT}`);
      console.log(`  Network: http://${lanIp}:${PORT}`);
      console.log(`  EBS Media Dir: ${UPLOAD_DIR}`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();
