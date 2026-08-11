import nodemailer from "nodemailer";

type InvitationEmailInput = {
  to: string;
  organizationName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
};

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing email environment variable: ${key}`);
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function invitationText(input: InvitationEmailInput) {
  return [
    `${input.inviterName} invited you to join ${input.organizationName} on Kora.`,
    "",
    `Role: ${input.role}`,
    "",
    "Accept your invitation:",
    input.invitationUrl,
    "",
    "Use the same email address that received this invite when signing in or creating an account.",
  ].join("\n");
}

function invitationHtml(input: InvitationEmailInput) {
  const organizationName = escapeHtml(input.organizationName);
  const inviterName = escapeHtml(input.inviterName);
  const role = escapeHtml(input.role);
  const invitationUrl = escapeHtml(input.invitationUrl);

  return `
    <div style="margin:0;background:#050505;padding:32px;font-family:Inter,Arial,sans-serif;color:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.12);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03));padding:28px;">
        <p style="margin:0 0 12px;color:#60a5fa;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Kora invitation</p>
        <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.15;">Join ${organizationName}</h1>
        <p style="margin:18px 0 0;color:#cbd5e1;font-size:15px;line-height:1.7;">${inviterName} invited you to join ${organizationName} as <strong style="color:#ffffff;">${role}</strong>.</p>
        <a href="${invitationUrl}" style="display:inline-block;margin-top:24px;border-radius:10px;background:#ffffff;color:#050505;padding:12px 18px;text-decoration:none;font-weight:700;font-size:14px;">Accept invitation</a>
        <p style="margin:22px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">Use the same email address that received this invite when signing in or creating an account.</p>
        <p style="margin:18px 0 0;color:#64748b;font-size:12px;line-height:1.6;word-break:break-all;">${invitationUrl}</p>
      </div>
    </div>
  `;
}

export async function sendInvitationEmail(input: InvitationEmailInput) {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = (process.env.SMTP_SECURE ?? "true") === "true";
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASSWORD");
  const from = process.env.SMTP_FROM || user;

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const info = await transport.sendMail({
    from,
    to: input.to,
    subject: `You're invited to ${input.organizationName} on Kora`,
    text: invitationText(input),
    html: invitationHtml(input),
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted.map(String),
    rejected: info.rejected.map(String),
    response: info.response,
  };
}