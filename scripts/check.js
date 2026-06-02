const fs = require('fs');
const required = ['index.html','assets/app.js','assets/style.css','netlify/functions/market.js','netlify/functions/agent.js','netlify/functions/sodex.js'];
for (const f of required) {
  if (!fs.existsSync(f)) {
    console.error(`Missing ${f}`);
    process.exit(1);
  }
}
console.log('Static Netlify build ready.');
