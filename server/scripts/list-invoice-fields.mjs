import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '..', 'templates', 'invoice.pdf');
const bytes = readFileSync(templatePath);
const doc = await PDFDocument.load(bytes);
const form = doc.getForm();
const fields = form.getFields();
console.log('Form fields:');
fields.forEach((f) => console.log(' -', f.getName(), `(${f.constructor.name})`));
