import PDFDocument from 'pdfkit';
import { formatOrderNumber } from '../utils/format.js';

/**
 * @param {InstanceType<typeof PDFDocument>} doc
 * @returns {Promise<Buffer>}
 */
function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/**
 * Generate a filled invoice PDF (A4, PDFKit). Returns buffer.
 * @param {Object} booking - Booking record (orderNumber, packageName, packagePrice, shootDate, location, etc.)
 * @param {Object} user - User record (name, email)
 * @param {{ pricePence?: number, customerName?: string, customerEmail?: string, serviceName?: string, location?: string, invoiceDate?: string, shootDate?: string }} [options] - Overrides for PDF fields
 * @returns {Promise<Buffer>}
 */
export async function generateInvoicePdf(booking, user, options = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const done = collectPdfBuffer(doc);

  const orderNo = formatOrderNumber(booking.orderNumber) || '—';
  const invoiceDateStr =
    options.invoiceDate != null && options.invoiceDate !== ''
      ? new Date(options.invoiceDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  let shootDateStr = '—';
  const shootSource =
    options.shootDate != null && options.shootDate !== '' ? options.shootDate : booking.shootDate;
  if (shootSource) {
    shootDateStr = new Date(shootSource).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const pricePence = options.pricePence != null ? options.pricePence : (booking.packagePrice ?? 0);
  const amountStr = `£${(pricePence / 100).toFixed(2)}`;
  const customerName = String(options.customerName ?? user?.name ?? '—').slice(0, 120);
  const customerEmail = String(options.customerEmail ?? user?.email ?? '—').slice(0, 120);
  const serviceName = String(options.serviceName ?? booking.packageName ?? '—').slice(0, 120);
  const location = String(options.location ?? booking.location ?? '—').slice(0, 120);

  const accent = '#C41E3A';
  const text = '#111827';
  const muted = '#6b7280';
  const boxBg = '#FBE9E7';

  let y = 48;

  doc.fillColor(accent).fontSize(20).font('Helvetica-Bold').text('SkyReach Visuals', 48, y);
  y += 28;
  doc.fillColor(text).fontSize(18).font('Helvetica-Bold').text('Invoice', 48, y);
  y += 28;

  doc.fontSize(10).font('Helvetica').fillColor(muted);
  doc.text(`${invoiceDateStr}   ·   Order ${orderNo}`, 48, y);
  y += 22;

  doc.roundedRect(48, y, 499, 52, 6).fill(boxBg);
  doc.fillColor(text).font('Helvetica-Bold').fontSize(18);
  doc.text(amountStr, 48, y + 14, { width: 499, align: 'center' });
  y += 68;

  const row = (label, value, yy) => {
    doc.font('Helvetica').fontSize(10).fillColor(muted).text(label, 48, yy, { width: 120 });
    doc.font('Helvetica').fillColor(text).text(value, 180, yy, { width: 360 });
  };

  row('Customer', customerName, y);
  y += 18;
  row('Email', customerEmail, y);
  y += 18;
  row('Service', serviceName, y);
  y += 18;
  row('Shoot date', shootDateStr, y);
  y += 18;
  row('Location', location, y);
  y += 36;

  doc.fontSize(9).fillColor(muted).font('Helvetica');
  doc.text(
    'SkyReach Visuals · Bournemouth, Dorset, UK · 07877 691861',
    48,
    y,
    { width: 499, align: 'center' }
  );

  doc.end();
  return done;
}
