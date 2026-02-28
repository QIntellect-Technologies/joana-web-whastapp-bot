import * as XLSX from 'xlsx';
import * as fs from 'fs';

try {
    const fileBuffer = fs.readFileSync('Global_Menu_Template.xlsx');
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    console.log(`Successfully read Excel file.`);
    console.log(`Total rows found: ${data.length}`);
    if (data.length > 35) {
        console.log("SUCCESS: File contains the full expanded menu.");
    } else {
        console.log("FAILURE: File still contains the truncated menu.");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
