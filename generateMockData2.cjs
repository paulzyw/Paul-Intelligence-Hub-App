const fs = require('fs');

const mockContent = fs.readFileSync('./src/apps/revos/leads/components/mockQualificationData.ts', 'utf8');

if (mockContent.includes("evidenceAssessments.push")) {
   console.log("Mock script retains push logic!");
}

