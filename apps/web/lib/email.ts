import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender email — dùng domain đã verified trên Resend
// Nếu chưa verify domain, Resend sẽ dùng 'onboarding@resend.dev' (chỉ gửi đến email owner)
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Tiệm Rêu Decor <no-reply@tiemreudecor.com>'; 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiemreudecor.com';

export function escapeEmailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!resend) {
    return { success: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const subject = input.subject.replace(/[\r\n]/g, " ").trim().slice(0, 180);

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: input.to,
      subject,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, id: data?.id ?? null };
  } catch (error) {
    console.error("Failed to send transactional email:", error);
    return { success: false as const, error: "Lỗi nội bộ khi gửi email" };
  }
}

function getPasswordResetEmailHTML(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu - Tiệm Rêu Decor</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4ee; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4ee; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #425733 0%, #2d3d23 100%); border-radius: 16px 16px 0 0; padding: 32px 24px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Leaf Icon -->
                    <div style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                      <img src="${SITE_URL}/favicon.ico" alt="" width="28" height="28" style="display: block;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                      tiệm Rêu Décor
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-transform: uppercase;">
                      Terrarium &amp; Moss Art
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Decorative terrarium banner -->
          <tr>
            <td style="background-color: #ffffff; padding: 0; text-align: center;">
              <div style="height: 4px; background: linear-gradient(90deg, #8fba6f, #425733, #8fba6f);"></div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 28px;">
              <!-- Security Icon + Title -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background-color: #e3ebdd; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 28px;">🔒</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #1a2e12;">
                      Yêu cầu đặt lại mật khẩu
                    </h2>
                    <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Tiệm Rêu Décor.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height: 1px; background-color: #e3ebdd; margin: 24px 0;"></div>

              <!-- Instructions -->
              <p style="font-size: 14px; color: #444; line-height: 1.7; margin: 0 0 24px 0;">
                Nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết này sẽ <strong style="color: #425733;">hết hạn sau 1 giờ</strong> vì lý do bảo mật.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${resetLink}" 
                       target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #425733 0%, #3a5229 50%, #4a6a35 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 50px; box-shadow: 0 4px 14px rgba(66,87,51,0.3); letter-spacing: 0.3px;">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <div style="background-color: #f8faf6; border: 1px solid #e3ebdd; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #888; margin: 0 0 6px 0;">
                  Nếu nút không hoạt động, copy link sau vào trình duyệt:
                </p>
                <p style="font-size: 12px; color: #425733; word-break: break-all; margin: 0; line-height: 1.5;">
                  <a href="${resetLink}" style="color: #425733; text-decoration: underline;">${resetLink}</a>
                </p>
              </div>

              <!-- Security Notice -->
              <div style="display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px; background-color: #fff9e6; border: 1px solid #f0e6c0; border-radius: 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 10px; vertical-align: top;">
                      <span style="font-size: 16px;">⚠️</span>
                    </td>
                    <td>
                      <p style="font-size: 12px; color: #8a7540; margin: 0; line-height: 1.5;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8faf6; border-top: 1px solid #e3ebdd; border-radius: 0 0 16px 16px; padding: 24px 28px; text-align: center;">
              <p style="font-size: 13px; color: #425733; font-weight: 600; margin: 0 0 4px 0;">
                tiệm Rêu Décor
              </p>
              <p style="font-size: 11px; color: #888; margin: 0 0 12px 0;">
                Terrarium &amp; Moss Art — Mang thiên nhiên vào không gian sống
              </p>
              <div style="height: 1px; background-color: #e3ebdd; margin: 12px 0;"></div>
              <p style="font-size: 10px; color: #aaa; margin: 0; line-height: 1.6;">
                Email này được gửi tự động từ hệ thống Tiệm Rêu Décor.<br />
                Vui lòng không trả lời email này.<br />
                &copy; ${new Date().getFullYear()} Tiệm Rêu Décor. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email will not be sent.");
    console.log(`Password reset link (mock): ${SITE_URL}/reset-password?token=${token}`);
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  const resetLink = `${SITE_URL}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu - Tiệm Rêu Decor',
      html: getPasswordResetEmailHTML(resetLink),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { success: false, error: "Lỗi nội bộ khi gửi email" };
  }
}

function getPasswordResetCodeEmailHTML(code: string): string {
  const safeCode = escapeEmailHtml(code);

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã đặt lại mật khẩu - Tiệm Rêu Décor</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ee;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ee;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="background:linear-gradient(135deg,#425733 0%,#2d3d23 100%);padding:30px 24px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px">tiệm Rêu Décor</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.72);font-size:12px;letter-spacing:1.5px;text-transform:uppercase">Terrarium &amp; Moss Art</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;text-align:center">
              <h2 style="margin:0 0 10px;color:#1a2e12;font-size:20px">Mã đặt lại mật khẩu</h2>
              <p style="margin:0 0 22px;color:#4b5563;font-size:14px;line-height:1.6">
                Nhập mã 6 số bên dưới để xác minh yêu cầu đặt lại mật khẩu.
              </p>
              <div style="display:inline-block;padding:14px 24px;border-radius:12px;background:#f3f7ef;border:1px solid #d8e3d1;color:#425733;font-size:32px;font-weight:700;letter-spacing:8px">
                ${safeCode}
              </div>
              <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.6">
                Mã này sẽ hết hạn sau 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email will not be sent.");
    console.log(`Password reset verification code for ${email}: ${code}`);
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: "Mã đặt lại mật khẩu - Tiệm Rêu Décor",
      html: getPasswordResetCodeEmailHTML(code),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to send password reset code:", err);
    return { success: false, error: "Lỗi nội bộ khi gửi email" };
  }
}

function getRegistrationCodeEmailHTML(code: string): string {
  const safeCode = escapeEmailHtml(code);

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác minh tài khoản - Tiệm Rêu Décor</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ee;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ee;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="background:linear-gradient(135deg,#425733 0%,#2d3d23 100%);padding:30px 24px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px">tiệm Rêu Décor</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.72);font-size:12px;letter-spacing:1.5px;text-transform:uppercase">Terrarium &amp; Moss Art</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;text-align:center">
              <h2 style="margin:0 0 10px;color:#1a2e12;font-size:20px">Xác minh email của bạn</h2>
              <p style="margin:0 0 22px;color:#4b5563;font-size:14px;line-height:1.6">
                Nhập mã 6 số bên dưới để hoàn tất tạo tài khoản tại Tiệm Rêu Décor.
              </p>
              <div style="display:inline-block;padding:14px 24px;border-radius:12px;background:#f3f7ef;border:1px solid #d8e3d1;color:#425733;font-size:32px;font-weight:700;letter-spacing:8px">
                ${safeCode}
              </div>
              <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.6">
                Mã này sẽ hết hạn sau 10 phút. Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendRegistrationVerificationEmail(email: string, code: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email will not be sent.");
    console.log(`Registration verification code for ${email}: ${code}`);
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: "Mã xác minh tài khoản - Tiệm Rêu Décor",
      html: getRegistrationCodeEmailHTML(code),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to send registration email:", err);
    return { success: false, error: "Loi noi bo khi gui email" };
  }
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  if (!resend) {
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  const to =
    process.env.CONTACT_RECEIVER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "tiemreudecor@gmail.com";

  const plainSubject = (input.subject?.trim() || "Tin nhắn liên hệ mới").replace(/[\r\n]/g, " ").slice(0, 160);
  const safeSubject = escapeEmailHtml(plainSubject);
  const safeName = escapeEmailHtml(input.name);
  const safeEmail = escapeEmailHtml(input.email);
  const safeMessage = escapeEmailHtml(input.message);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2>Tiệm Rêu Décor nhận được tin nhắn mới</h2>
      <p><strong>Họ tên:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Tiêu đề:</strong> ${safeSubject}</p>
      <div style="margin-top:16px;padding:14px;border:1px solid #d8e3d1;border-radius:12px;background:#f8faf6;white-space:pre-wrap">${safeMessage}</div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      replyTo: input.email,
      subject: `[Contact] ${plainSubject}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to send contact notification:", err);
    return { success: false, error: "Lỗi nội bộ khi gửi email" };
  }
}
