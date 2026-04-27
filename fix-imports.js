const fs = require('fs');
const filePath = 'components/dashboard/AIAdvisorChatbot.tsx';

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Remove the problematic import line
const newContent = content.replace(
  /import \{ getAIResponse, createChatMessage, ChatMessage, AIResponse \} from '@\/lib\/aiAdvisor';/g,
  'import { useState, useEffect, useRef } from \'react\';\nimport { Holding, CashAccount, AssetAccount } from \'@\/lib\/types\';'
);

// Write the fixed content
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('Fixed problematic import in:', filePath);