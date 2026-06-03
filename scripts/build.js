const fs = require('fs');
const required = ['index.html','assets/app.js','assets/style.css','assets/strategies.json','netlify/functions/market.js','netlify/functions/agent.js','netlify/functions/sodex.js','netlify/functions/health.js'];
const missing = required.filter((f) => !fs.existsSync(f));
if (missing.length) {
  console.error('Missing files:', missing.join(', '));
  process.exit(1);
}
const signalModules = JSON.parse(fs.readFileSync('assets/strategies.json','utf8'));
console.log(`SoDEX Agent build OK · ${signalModules.count || (signalModules.strategies || []).length} signal modules`);
