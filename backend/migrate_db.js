import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import User from './models/User.js';
import SmsUser from './models/SmsUser.js';
import Case from './models/Case.js';
import Alert from './models/Alert.js';
import { processDocuments } from './upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db.json');

async function runMigration() {
  console.log('==================================================');
  console.log('Starting MongoDB Atlas & EBS Migration');
  console.log('==================================================\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Error: Data file not found at ${DATA_FILE}`);
    process.exit(1);
  }

  await connectDB();

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  // 1. Migrate Users
  const users = data.users || [];
  console.log(`Migrating ${users.length} Users...`);
  for (const u of users) {
    await User.findOneAndUpdate(
      { clientId: u.clientId },
      {
        clientId: u.clientId,
        name: u.name,
        password: u.password
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Users migrated.`);

  // 2. Migrate SmsUsers
  const smsUsers = data.smsUsers || [];
  console.log(`Migrating ${smsUsers.length} SMS Specialists...`);
  for (const s of smsUsers) {
    await SmsUser.findOneAndUpdate(
      { smsId: s.smsId },
      {
        smsId: s.smsId,
        firstName: s.firstName || 'Specialist',
        middleName: s.middleName || '',
        lastName: s.lastName || s.smsId,
        position: s.position || '',
        password: s.password,
        profileImage: s.profileImage || null
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ SMS Specialists migrated.`);

  // 3. Migrate Cases & EBS Media Files
  const cases = data.cases || [];
  console.log(`Migrating ${cases.length} Cases (converting any Base64 files to EBS disk storage)...`);
  for (const c of cases) {
    // Process case documents
    const processedDocs = processDocuments(c.documents || []);

    // Process chat documents
    const processedChats = (c.chats || []).map(ch => ({
      sender: ch.sender,
      text: ch.text || '',
      documents: processDocuments(ch.documents || []),
      readByCms: !!ch.readByCms,
      timestamp: ch.timestamp || new Date().toISOString()
    }));

    await Case.findOneAndUpdate(
      { id: c.id },
      {
        id: c.id,
        clientId: c.clientId,
        clientName: c.clientName,
        age: c.age || 'N/A',
        sex: c.sex || 'Not Specified',
        city: c.city || 'N/A',
        state: c.state || 'N/A',
        details: c.details,
        documents: processedDocs,
        status: c.status || 'Pending',
        category: c.category || '',
        targetSme: c.targetSme || '',
        smsNotes: c.smsNotes || '',
        lexPrompt: c.lexPrompt || '',
        lexOutput: c.lexOutput || '',
        finalFeedback: c.finalFeedback || '',
        reviewerInfo: c.reviewerInfo || null,
        chats: processedChats,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString()
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Cases and exhibits migrated to MongoDB & EBS.`);

  // 4. Migrate Alerts
  const alerts = data.alerts || [];
  console.log(`Migrating ${alerts.length} Alerts...`);
  for (const a of alerts) {
    await Alert.findOneAndUpdate(
      { id: a.id },
      {
        id: a.id,
        caseId: a.caseId,
        title: a.title,
        message: a.message || '',
        structuredData: a.structuredData || {},
        read: !!a.read,
        createdAt: a.createdAt || new Date().toISOString()
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Alerts migrated.`);

  console.log('\n==================================================');
  console.log('Migration Completed Successfully!');
  console.log(`Total Migrated:`);
  console.log(`- Users: ${await User.countDocuments()}`);
  console.log(`- SMS Users: ${await SmsUser.countDocuments()}`);
  console.log(`- Cases: ${await Case.countDocuments()}`);
  console.log(`- Alerts: ${await Alert.countDocuments()}`);
  console.log('==================================================\n');

  process.exit(0);
}

runMigration().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
