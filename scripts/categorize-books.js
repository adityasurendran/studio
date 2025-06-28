const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const booksDir = path.join(__dirname, '../books');
const outputJson = path.join(booksDir, 'subject-mapping.json');

// Define some basic subject keywords for categorization
const SUBJECT_KEYWORDS = {
  maths: ['math', 'algebra', 'geometry', 'trigonometry', 'calculus'],
  science: ['science', 'biology', 'chemistry', 'physics'],
  history: ['history', 'historical'],
  geography: ['geography', 'geo'],
  english: ['english', 'literature', 'language', 'shakespeare'],
  irish: ['irish', 'gaeilge'],
  'home economics': ['home economics', 'home ec'],
  business: ['business', 'accounting', 'economics'],
  religion: ['religion', 'religious'],
  civics: ['cspe', 'civic', 'social', 'political'],
  french: ['french'],
  spanish: ['spanish'],
  german: ['german'],
  art: ['art', 'visual'],
  music: ['music'],
  technology: ['technology', 'tech', 'engineering'],
};

function detectSubject(filename, text) {
  const lowerFilename = filename.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Sort subjects by keyword length (longest first) to prioritize specific matches
  const sortedSubjects = Object.entries(SUBJECT_KEYWORDS).sort((a, b) => {
    const aMaxLength = Math.max(...a[1].map(k => k.length));
    const bMaxLength = Math.max(...b[1].map(k => k.length));
    return bMaxLength - aMaxLength;
  });
  
  for (const [subject, keywords] of sortedSubjects) {
    for (const keyword of keywords) {
      if (lowerFilename.includes(keyword) || lowerText.includes(keyword)) {
        return subject;
      }
    }
  }
  return 'uncategorized';
}

async function categorizeBooks() {
  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.pdf'));
  const subjectMap = {};

  for (const file of files) {
    const filePath = path.join(booksDir, file);
    let subject = 'uncategorized';
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const sampleText = pdfData.text.slice(0, 1000); // First 1000 chars
      subject = detectSubject(file, sampleText);
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
    }
    if (!subjectMap[subject]) subjectMap[subject] = [];
    subjectMap[subject].push(file);
  }

  // Print mapping to console
  console.log('Subject mapping:');
  for (const [subject, files] of Object.entries(subjectMap)) {
    console.log(`- ${subject}:`);
    files.forEach(f => console.log(`    ${f}`));
  }

  // Write mapping to JSON file
  fs.writeFileSync(outputJson, JSON.stringify(subjectMap, null, 2));
  console.log(`\nMapping written to ${outputJson}`);
}

categorizeBooks(); 