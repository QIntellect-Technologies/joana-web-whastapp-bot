import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const files = [
    "e:/Imran Projects/QIntellect Projects/Whatsapp Bot/Joana_Information/Branches.xlsx",
    "e:/Imran Projects/QIntellect Projects/Whatsapp Bot/Joana_Information/Menu (9).xlsx"
];

const results = {};

files.forEach(file => {
    try {
        const workbook = xlsx.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

        results[path.basename(file)] = data.slice(0, 5); // First 5 rows
    } catch (e) {
        results[path.basename(file)] = { error: e.message };
    }
});

fs.writeFileSync('debug_output.json', JSON.stringify(results, null, 2));
console.log("Done");
