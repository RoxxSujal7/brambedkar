// Atlas connection test
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI;
if (!uri) { console.error('NO MONGO_URI'); process.exit(1); }
const display = uri.split('@')[1] || '(parse error)';
console.log('Atlas endpoint:', display.split('?')[0]);
const start = Date.now();
mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 })
  .then(async () => {
    console.log('CONNECTED in', (Date.now()-start)+'ms');
    console.log('Host:', mongoose.connection.host);
    console.log('DB:', mongoose.connection.name);
    console.log('readyState:', mongoose.connection.readyState);
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', cols.length, ':', cols.map(c=>c.name).join(', ') || '(none)');
    await mongoose.disconnect();
    console.log('OK disconnected.');
    process.exit(0);
  })
  .catch(err => { console.error('FAILED:', err.message); process.exit(1); });
