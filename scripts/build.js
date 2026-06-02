const fs = require('fs');
const required = [
  'index.html',
  'assets/app.js',
  'assets/style.css',
  'netlify/functions/_utils.js',
  'netlify/functions/market.js',
  'netlify/functions/agent.js',
  'netlify/functions/sodex.js',
  'netlify/functions/health.js'
];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}
console.log('SoDEX Agent Pro build OK');
