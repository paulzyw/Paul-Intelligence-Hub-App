const fs = require('fs');
const config = JSON.parse(fs.readFileSync('src/config/SQL_evidence_knowledge_base.json', 'utf8'));
const library = config.UREKB_SQL.revenue_motion_library["Digital Solution Selling"];
let c = 0;
if (library) {
  Object.entries(library).forEach(([key, val]) => {
     if (Array.isArray(val)) {
        c += val.length;
     } else if (val.evidence_objects) {
        c += val.evidence_objects.length;
     }
  });
}
console.log("Count:", c);
