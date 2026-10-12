/**
 * Optional new-lead notifications.
 *
 * If SMTP settings are present in the environment and `nodemailer` is
 * installed, a new lead is emailed to NOTIFY_EMAIL. Otherwise we fall back to a
 * console line, so development works with zero configuration and a lead is
 * never silently lost.
 */

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function formatLead(lead) {
  return [
    `New project enquiry: ${lead.service}`,
    "",
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Service: ${lead.service}`,
    `Budget:  ${lead.budget || "-"}`,
    "",
    "Message:",
    lead.message,
    "",
    `Received: ${lead.created_at} UTC (lead #${lead.id})`,
  ].join("\n");
}

export async function notifyNewLead(lead) {
  const text = formatLead(lead);

  if (!smtpConfigured()) {
    console.log(`\n[lead #${lead.id}] ${lead.name} <${lead.email}> — ${lead.service}\n`);
    return { delivered: false, reason: "smtp-not-configured" };
  }

  let nodemailer;
  try {
    ({ default: nodemailer } = await import("nodemailer"));
  } catch {
    console.warn("[notify] nodemailer not installed; logging instead.\n" + text);
    return { delivered: false, reason: "nodemailer-missing" };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM || `Website <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
    replyTo: lead.email,
    subject: `Project enquiry: ${lead.service} — ${lead.name}`,
    text,
  });

  return { delivered: true };
}