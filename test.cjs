const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./src/config/SQL_evidence_knowledge_base.json', 'utf8'));
const motion = config.UREKB_SQL.revenue_motion_library["Digital Solution Selling"];
const dimensions = Object.keys(motion);
console.log("Dimensions:", dimensions);
const firstEv = motion[dimensions[0]][0];
console.log("First evidence:", firstEv);
