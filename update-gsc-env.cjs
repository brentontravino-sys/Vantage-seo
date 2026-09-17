const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
let txt = fs.readFileSync(envPath, 'utf8');

const newId = process.env.GSC_CLIENT_ID;
const newSecret = process.env.GSC_CLIENT_SECRET;

if (!newId || !newSecret) {
  console.error('Error: GSC_CLIENT_ID and GSC_CLIENT_SECRET environment variables must be set');
  process.exit(1);
}

txt = txt.replace(/^GSC_CLIENT_ID=.*$/m, `GSC_CLIENT_ID=${newId}`);
txt = txt.replace(/^GSC_CLIENT_SECRET=.*$/m, `GSC_CLIENT_SECRET=${newSecret}`);

fs.writeFileSync(envPath, txt, { encoding: 'utf8', mode: 0o600 });
console.log('GSC creds updated in .env');
