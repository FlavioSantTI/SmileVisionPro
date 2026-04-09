const fs = require('fs');

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace sky- with primary-
  content = content.replace(/sky-/g, 'primary-');
  
  // Replace emerald- with accent- (since Mint Green is for accents/success)
  content = content.replace(/emerald-/g, 'accent-');
  
  // Replace slate- with charcoal- for text and borders to match the deep Charcoal Gray
  content = content.replace(/slate-/g, 'charcoal-');
  
  // Replace bg-slate-50 with bg-white to ensure pure white backgrounds
  content = content.replace(/bg-charcoal-50/g, 'bg-white');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

replaceColors('src/App.tsx');
replaceColors('src/components/Odontogram.tsx');
