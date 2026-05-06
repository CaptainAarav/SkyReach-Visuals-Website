import PDFDocument from 'pdfkit';
import { formatOrderNumber } from '../utils/format.js';
import { env } from '../config/env.js';

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

/** Matches SkyReach_Invoice_PostBox_Perfect.pdf (ReportLab reference layout). */
const COMPANY = {
  name: 'SkyReach Visuals',
  addressLines: ['106 Redhill Drive', 'Bournemouth BH10 6AW'],
  phone: 'Mob: 07877 691861',
};

const THANK_YOU =
  'Thank you for choosing SkyReach Visuals. It has been a pleasure working with you, and we look forward to future projects together.';

const SIGNATORY = ['Ollie Gill', 'Director, SkyReach Visuals'];

const BLACK = '#111111';
const MUTED = '#4b5563';
const RULE = '#d1d5db';

/**
 * Generate a filled invoice PDF (A4, PDFKit). Returns buffer.
 * Layout aligned with the root reference PDF (header, Bill To, metadata row, line table, totals, sign-off, payment details).
 * @param {Object} booking - Booking record (orderNumber, packageName, packagePrice, shootDate, location, etc.)
 * @param {Object} user - User record (name, email)
 * @param {{
 *   pricePence?: number,
 *   customerName?: string,
 *   customerEmail?: string,
 *   serviceName?: string,
 *   location?: string,
 *   invoiceDate?: string,
 *   shootDate?: string,
 *   paymentMethod?: 'stripe' | 'bank_transfer',
 *   paymentTerms?: string,
 *   descriptionLines?: string[],
 * }} [options]
 * @returns {Promise<Buffer>}
 */
export async function generateInvoicePdf(booking, user, options = {}) {
  const margin = 48;
  const pageWidth = 595.28;
  const contentW = pageWidth - margin * 2;

  const doc = new PDFDocument({ size: 'A4', margin });
  const done = collectPdfBuffer(doc);

  const orderRaw = formatOrderNumber(booking.orderNumber);
  const invoiceNoStr =
    orderRaw !== '' ? String(orderRaw).padStart(5, '0') : 'DRAFT';

  const invoiceDateStr =
    options.invoiceDate != null && options.invoiceDate !== ''
      ? new Date(options.invoiceDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let shootDateStr = '—';
  const shootSource =
    options.shootDate != null && options.shootDate !== '' ? options.shootDate : booking.shootDate;
  if (shootSource) {
    shootDateStr = new Date(shootSource).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const pricePence = options.pricePence != null ? options.pricePence : (booking.packagePrice ?? 0);
  const amountStr = `£${(pricePence / 100).toFixed(2)}`;
  const customerName = String(options.customerName ?? user?.name ?? '—').slice(0, 120);
  const customerEmail = String(options.customerEmail ?? user?.email ?? '').slice(0, 120);
  const serviceName = String(options.serviceName ?? booking.packageName ?? '—').slice(0, 120);
  const location = String(options.location ?? booking.location ?? '').trim();

  const paymentTerms = String(options.paymentTerms ?? '30 days').slice(0, 80);
  const paymentMethod = options.paymentMethod;

  const descriptionLines = Array.isArray(options.descriptionLines)
    ? options.descriptionLines.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const defaultBlurb = [serviceName, location ? `Location: ${location}` : '']
    .filter(Boolean)
    .join('. ');
  const descriptionBlurb =
    defaultBlurb ||
    'Professional drone and media services as agreed.';

  const bank = env.bank;
  const bankComplete = !!(bank.accountName && bank.sortCode && bank.accountNumber);

  let y = margin;

  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(15).text(COMPANY.name, margin, y, { width: 260 });

  doc.font('Helvetica-Bold').fontSize(22).text('Invoice', margin, y, { width: contentW, align: 'right' });
  y += 22;

  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  for (const line of COMPANY.addressLines) {
    doc.text(line, margin, y, { width: 280 });
    y += 11;
  }
  doc.text(COMPANY.phone, margin, y, { width: 280 });
  y += 22;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text('Bill To:', margin, y);
  y += 14;
  doc.font('Helvetica').fontSize(10).text(customerName, margin, y, { width: contentW });
  y += 13;
  if (customerEmail) {
    doc.text(customerEmail, margin, y, { width: contentW });
    y += 13;
  }
  if (location) {
    doc.text(location, margin, y, { width: contentW });
    y += 13;
  }
  y += 8;

  const metaTop = y;
  const colW = contentW / 4;
  const meta = [
    ['Service Date:', shootDateStr],
    ['Invoice Date:', invoiceDateStr],
    ['Invoice No:', invoiceNoStr],
    ['Payment Terms:', paymentTerms],
  ];
  let mx = margin;
  for (const [label, val] of meta) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text(label, mx, metaTop, { width: colW - 6 });
    doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(val, mx, metaTop + 11, { width: colW - 6 });
    mx += colW;
  }
  y = metaTop + 36;

  doc.font('Helvetica-Bold').fontSize(10).text('Project Title:', margin, y);
  y += 14;
  doc.font('Helvetica').fontSize(10).text(serviceName, margin, y, { width: contentW });
  y += 16;

  doc.font('Helvetica-Bold').fontSize(10).text('Description:', margin, y);
  y += 14;
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(descriptionBlurb, margin, y, { width: contentW });
  y += doc.heightOfString(descriptionBlurb, { width: contentW }) + 14;

  const xDesc = margin;
  const xQty = margin + 210;
  const xUnit = margin + 270;
  const xTot = margin + 360;
  const rowH = 18;

  doc.strokeColor(RULE).moveTo(margin, y).lineTo(margin + contentW, y).stroke();
  y += 6;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(BLACK);
  doc.text('Description', xDesc, y, { width: 200 });
  doc.text('Quantity', xQty, y, { width: 44, align: 'right' });
  doc.text('Unit Price', xUnit, y, { width: 70, align: 'right' });
  doc.text('Total', xTot, y, { width: 70, align: 'right' });
  y += rowH;

  doc.moveTo(margin, y).lineTo(margin + contentW, y).stroke();
  y += 6;

  doc.font('Helvetica').fontSize(9);
  doc.text(`${serviceName}`, xDesc, y, { width: 200 });
  doc.text('1', xQty, y, { width: 44, align: 'right' });
  doc.text(amountStr, xUnit, y, { width: 70, align: 'right' });
  doc.text(amountStr, xTot, y, { width: 70, align: 'right' });
  y += rowH;

  for (const line of descriptionLines) {
    doc.fillColor(MUTED).text(`• ${line}`, xDesc, y, { width: contentW - 40 });
    y += 13;
  }

  y += 6;
  doc.strokeColor(RULE).moveTo(margin, y).lineTo(margin + contentW, y).stroke();
  y += 10;

  doc.fillColor(BLACK).font('Helvetica').fontSize(9);
  doc.text('Subtotal', xUnit, y, { width: 70, align: 'right' });
  doc.text(amountStr, xTot, y, { width: 70, align: 'right' });
  y += 16;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Amount Due', xUnit, y, { width: 70, align: 'right' });
  doc.text(amountStr, xTot, y, { width: 70, align: 'right' });
  y += 28;

  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  doc.text(THANK_YOU, margin, y, { width: contentW, align: 'left' });
  y += doc.heightOfString(THANK_YOU, { width: contentW }) + 16;

  doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(10).text(SIGNATORY[0], margin, y);
  y += 13;
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(SIGNATORY[1], margin, y);
  y += 28;

  if (paymentMethod === 'stripe') {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text('Payment:', margin, y);
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(
      'Please complete payment using the secure Stripe link sent to this email.',
      margin,
      y,
      { width: contentW }
    );
    y += 36;
  } else if (bankComplete) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text('Payment Details:', margin, y);
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text(`Account Name: ${bank.accountName}`, margin, y, { width: contentW });
    y += 13;
    doc.text(`Account Number: ${bank.accountNumber}`, margin, y, { width: contentW });
    y += 13;
    doc.text(`Sort Code: ${bank.sortCode}`, margin, y, { width: contentW });
    y += 13;
    if (bank.referenceHint) {
      doc.text(`Reference: ${bank.referenceHint}`, margin, y, { width: contentW });
    }
  } else {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(
      'Payment instructions will be included when your invoice is sent.',
      margin,
      y,
      { width: contentW }
    );
  }

  doc.end();
  return done;
}
