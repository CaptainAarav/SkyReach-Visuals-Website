import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { formatOrderNumber } from '../utils/format.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Path to the invoice template PDF (must exist under server/templates/) */
const TEMPLATE_PATH = join(__dirname, '..', '..', 'templates', 'invoice.pdf');

/**
 * Positions and font size for overlay text on the invoice PDF (in points, from bottom-left).
 * Adjust these to match your template layout. A4 is 595 x 842 points.
 */
const LAYOUT = {
  orderNumber: { x: 420, y: 790, size: 11 },
  date: { x: 420, y: 772, size: 10 },
  customerName: { x: 80, y: 720, size: 11 },
  customerEmail: { x: 80, y: 702, size: 10 },
  service: { x: 80, y: 660, size: 11 },
  amount: { x: 420, y: 660, size: 12 },
  location: { x: 80, y: 642, size: 10 },
};

/**
 * Generate a filled invoice PDF for a booking. Returns buffer or null if template missing.
 * @param {Object} booking - Booking record (orderNumber, packageName, packagePrice, shootDate, location, etc.)
 * @param {Object} user - User record (name, email)
 * @param {{ pricePence?: number, customerName?: string, customerEmail?: string, serviceName?: string, location?: string, invoiceDate?: string }} [options] - Overrides for PDF fields
 * @returns {Promise<Buffer|null>}
 */
export async function generateInvoicePdf(booking, user, options = {}) {
  let templateBytes;
  try {
    templateBytes = readFileSync(TEMPLATE_PATH);
  } catch (err) {
    console.warn('Invoice template not found at', TEMPLATE_PATH, err.message);
    return null;
  }

  const doc = await PDFDocument.load(templateBytes);
  const pages = doc.getPages();
  const page = pages[0];
  if (!page) return null;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();

  const orderNo = formatOrderNumber(booking.orderNumber);
  const dateStr = options.invoiceDate != null && options.invoiceDate !== ''
    ? (new Date(options.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pricePence = options.pricePence != null ? options.pricePence : (booking.packagePrice ?? 0);
  const amountStr = `£${(pricePence / 100).toFixed(2)}`;

  const draw = (text, { x, y, size }) => {
    if (text == null || text === '') return;
    const safe = String(text).slice(0, 120);
    page.drawText(safe, {
      x,
      y: height - y,
      size: size || 10,
      font,
    });
  };

  draw(orderNo, LAYOUT.orderNumber);
  draw(dateStr, LAYOUT.date);
  draw(options.customerName ?? user?.name ?? '', LAYOUT.customerName);
  draw(options.customerEmail ?? user?.email ?? '', LAYOUT.customerEmail);
  draw(options.serviceName ?? booking.packageName ?? '', LAYOUT.service);
  draw(amountStr, LAYOUT.amount);
  draw(options.location ?? booking.location ?? '', LAYOUT.location);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
