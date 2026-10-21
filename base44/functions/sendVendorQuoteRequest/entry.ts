import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const vendorId = typeof payload?.vendor_id === 'string' ? payload.vendor_id.trim() : '';
    const subject = typeof payload?.subject === 'string' ? payload.subject.trim().slice(0, 150) : '';
    const message = typeof payload?.message === 'string' ? payload.message.trim().slice(0, 4000) : '';

    if (!vendorId || !subject || !message) {
      return Response.json({ error: 'Pick a vendor and give the email a subject and a message.' }, { status: 400 });
    }

    // The recipient is always read from the saved vendor record, never from the request.
    let vendor;
    try {
      vendor = await base44.entities.Vendor.get(vendorId);
    } catch {
      return Response.json({ error: 'That vendor is no longer on your list.' }, { status: 404 });
    }

    const to = String(vendor.email || '').trim();
    if (!EMAIL.test(to)) {
      return Response.json({ error: 'Save a valid email address for this vendor first.' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      ...(user.full_name ? { from_name: user.full_name } : {}),
      body: `<div style="white-space:pre-wrap">${escapeHtml(message)}</div>`,
      text: message,
    });

    const status = !vendor.status || vendor.status === 'researching' ? 'contacted' : vendor.status;
    if (status !== vendor.status) await base44.entities.Vendor.update(vendor.id, { status });

    return Response.json({ sent: true, to, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}