const fs = require('fs');
const path = require('path');

console.log('--- VALIDATING PROJECT FILES ---');

const files = [
  'index.html',
  'css/style.css',
  'js/engine.js',
  'js/history.js',
  'js/calculator.js',
  'js/app.js'
];

let allExist = true;
for (const file of files) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const size = fs.statSync(fullPath).size;
    console.log(`✅ ${file} (${size} bytes)`);
  } else {
    console.error(`❌ Missing: ${file}`);
    allExist = false;
  }
}

// Verify index.html references
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const expectedIds = [
  'primaryDisplay',
  'secondaryDisplay',
  'evalPreview',
  'btnAngleMode',
  'angleModeBadge',
  'btnShift',
  'btnSoundToggle',
  'soundIcon',
  'keypadSci',
  'keypadBasic',
  'historyPanel',
  'historyList',
  'btnHistoryToggle',
  'btnHistoryClose',
  'btnHistoryClear',
  'btnThemeToggle',
  'themeIcon',
  'themeLabelText',
  'memoryBadge',
  'calcToast',
  'btnInfoModal',
  'infoModal',
  'btnInfoClose',
  'mobileTabs'
];

let allIdsFound = true;
for (const id of expectedIds) {
  if (html.includes(`id="${id}"`)) {
    console.log(`✅ Element found: #${id}`);
  } else {
    console.error(`❌ Missing element ID in index.html: #${id}`);
    allIdsFound = false;
  }
}

if (!allExist || !allIdsFound) {
  process.exit(1);
} else {
  console.log('All files and element IDs verified successfully!');
}
