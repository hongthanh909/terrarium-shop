import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender email — dùng domain đã verified trên Resend
// Nếu chưa verify domain, Resend sẽ dùng 'onboarding@resend.dev' (chỉ gửi đến email owner)
const DEFAULT_FROM = 'Tiệm Rêu Decor <no-reply@tiemreudecor.com>'; 

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email will not be sent.");
    console.log(`Password reset link (mock): ${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`);
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tiemreudecor.com'}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu - Tiệm Rêu Decor',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
          <h2 style="color: #425733;">Tiệm Rêu Decor</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.</p>
          <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau 1 giờ.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #425733; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p>Hoặc bạn có thể copy link sau dán vào trình duyệt:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này.</p>
        </div>
      `,
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
