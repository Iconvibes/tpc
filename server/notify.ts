import { db, type ShipmentRow } from './db.js';
import { logger } from './utils/logger.js';

const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
const RESEND_FROM = process.env.RESEND_FROM || 'TPC Logistics <onboarding@resend.dev>';

/* ------------------------------- template -------------------------------- */

const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

function statusEmoji(status: string): string {
  switch (status) {
    case 'Delivered': return '✅';
    case 'Out for Delivery': return '🚚';
    case 'Customs': return '🛃';
    case 'In Transit': return '✈️';
    case 'Picked Up': return '📦';
    default: return '📝';
  }
}

interface EmailEvent {
  status: string;
  location: string;
  note?: string | null;
  happened_at: string;
}

function emailHtml(shipment: ShipmentRow, event: EmailEvent): string {
  const trackUrl = `${SITE_URL}/tracking?q=${encodeURIComponent(shipment.tracking_id)}`;
  const rows: [string, string][] = [
    ['Tracking ID', `<b>${esc(shipment.tracking_id)}</b>`],
    ['Cargo', esc(shipment.cargo)],
    ['Route', `${esc(shipment.origin)} → ${esc(shipment.destination)}`],
    ['Weight', esc(shipment.weight)],
    ['Mode', `${esc(shipment.mode)} freight`],
    ['Estimated delivery', esc(shipment.eta || '—')]
  ];
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f2f5f9;font-family:Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e9f2;">
        <tr>
          <td style="background:#0a1a2f;padding:26px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:bold;">TPC <span style="color:#f5a623;">Logistics</span></span>
            <span style="display:block;color:#93a7c4;font-size:11px;letter-spacing:2px;margin-top:4px;">DELIVERING EXCELLENCE</span>
          </td>
        </tr>
        <tr><td style="padding:30px 32px;">
          <h1 style="margin:0 0 6px;font-size:20px;color:#101d31;">${statusEmoji(event.status)} Your shipment is now <span style="color:#e08e00;">${esc(event.status)}</span></h1>
          <p style="margin:0 0 20px;color:#46556c;font-size:14px;line-height:1.6;">
            Hi ${esc(shipment.customer)}, here's the latest update on your shipment.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border:1px solid #e3e9f2;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
            <tr><td style="padding:5px 0;color:#72809a;font-size:12px;">📍 <b style="color:#e08e00;">${esc(event.location)}</b></td></tr>
            <tr><td style="padding:5px 0;color:#46556c;font-size:14px;line-height:1.6;">${esc(event.note || 'No additional notes for this update.')}</td></tr>
            <tr><td style="padding:5px 0;color:#72809a;font-size:12px;">🕐 ${esc(event.happened_at)}</td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows.map(([label, value]) => `
            <tr>
              <td style="padding:5px 0;color:#72809a;font-size:12px;width:40%;">${esc(label)}</td>
              <td style="padding:5px 0;color:#101d31;font-size:13px;">${value}</td>
            </tr>`).join('')}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr><td align="center">
              <a href="${trackUrl}" style="display:inline-block;background:#f5a623;color:#0a1a2f;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 30px;border-radius:999px;">Track your shipment live</a>
            </td></tr>
          </table>
          <p style="margin:26px 0 0;color:#72809a;font-size:12px;line-height:1.7;">
            Questions? Call <b>+234 802 255 0250</b> or reply to this email.<br/>
            9b, Atiba Close, Onipetesi Estate, Ikeja, Lagos.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* --------------------------------- send --------------------------------- */

function record(shipmentId: number, recipient: string, subject: string, provider: string, status: string, error: string | null = null): void {
  try {
    db.prepare(
      'INSERT INTO notifications (shipment_id, recipient, subject, provider, status, error) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(shipmentId, recipient, subject, provider, status, error);
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'failed to record notification');
  }
}

/**
 * Sends a status-update email to the shipment's customer.
 * Uses Resend when RESEND_API_KEY is set; otherwise prints the email to the
 * server console (dev fallback). Never throws — errors are recorded in the DB.
 */
export async function sendShipmentUpdateEmail(shipment: ShipmentRow, event: EmailEvent): Promise<void> {
  const recipient = shipment.customer_email;
  if (!recipient) return;

  const subject = `${shipment.tracking_id} — ${event.status}: ${event.location}`;
  const html = emailHtml(shipment, event);

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: RESEND_FROM, to: [recipient], subject, html }),
        signal: AbortSignal.timeout(10_000)
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend HTTP ${res.status} ${body.slice(0, 200)}`);
      }
      record(shipment.id, recipient, subject, 'resend', 'sent');
      logger.info({ recipient, subject }, 'email sent via resend');
    } else {
      record(shipment.id, recipient, subject, 'console', 'logged');
      logger.info(
        { recipient, subject },
        'DEV MAIL (console fallback) — set RESEND_API_KEY to send real emails'
      );
    }
  } catch (err) {
    record(shipment.id, recipient, subject, 'resend', 'error', (err as Error).message);
    logger.error({ recipient, err: (err as Error).message }, 'email delivery failed');
  }
}

export const renderEmailHtml = emailHtml;
