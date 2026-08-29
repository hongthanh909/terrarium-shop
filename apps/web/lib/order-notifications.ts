import {
  OrderEmailEvent,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { escapeEmailHtml, sendTransactionalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tiemreudecor.com";
const MAX_ATTEMPTS = 5;
const SENDING_LEASE_MINUTES = 10;

type QueueOrderEmailInput = {
  orderId: string;
  eventKey: string;
  eventType: OrderEmailEvent;
  payload?: Prisma.InputJsonValue;
};

function normalizeEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function queueOrderEmail(
  tx: Prisma.TransactionClient,
  input: QueueOrderEmailInput
) {
  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    select: {
      shippingInfo: { select: { email: true } },
      customer: { select: { email: true } },
    },
  });
  const recipient = normalizeEmail(order?.shippingInfo?.email) || normalizeEmail(order?.customer?.email);

  if (!recipient) return { queued: false, reason: "missing_recipient" as const };

  const result = await tx.orderEmailNotification.createMany({
    data: [{
      orderId: input.orderId,
      eventKey: input.eventKey,
      eventType: input.eventType,
      recipient,
      ...(input.payload ? { payload: input.payload } : {}),
    }],
    skipDuplicates: true,
  });

  return { queued: result.count === 1 };
}

function asPayload(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function formatMoney(value: Prisma.Decimal | number | string) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value))}đ`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(value);
}

function parseVariants(value: Prisma.JsonValue) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
    return Object.values(parsed)
      .filter((entry) => typeof entry === "string" || typeof entry === "number")
      .map(String)
      .join(" · ");
  } catch {
    return "";
  }
}

const STATUS_CONTENT: Record<OrderStatus, { subject: string; title: string; message: string }> = {
  PENDING: {
    subject: "Đơn hàng đang chờ xác nhận",
    title: "Shop đã nhận yêu cầu của bạn",
    message: "Đơn hàng đang chờ Tiệm Rêu kiểm tra và xác nhận.",
  },
  CONFIRMED: {
    subject: "Đơn hàng đã được xác nhận",
    title: "Tiệm Rêu đã xác nhận đơn hàng",
    message: "Shop đang chuẩn bị sản phẩm theo thông tin bạn đã đặt.",
  },
  PROCESSING: {
    subject: "Đơn hàng đang được chuẩn bị",
    title: "Đơn hàng đang được đóng gói",
    message: "Tiệm Rêu đang chuẩn bị và kiểm tra sản phẩm trước khi giao.",
  },
  SHIPPING: {
    subject: "Đơn hàng đang được giao",
    title: "Đơn hàng đã bắt đầu giao",
    message: "Đơn hàng đang trên đường đến địa chỉ nhận hàng của bạn.",
  },
  SHIPPED: {
    subject: "Đơn hàng đã bàn giao cho đơn vị vận chuyển",
    title: "Đơn hàng đã được gửi đi",
    message: "Tiệm Rêu đã bàn giao đơn hàng cho đơn vị vận chuyển.",
  },
  DELIVERED: {
    subject: "Đơn hàng đã giao thành công",
    title: "Đơn hàng đã được giao",
    message: "Cảm ơn bạn đã mua sắm tại Tiệm Rêu Decor.",
  },
  CANCELLED: {
    subject: "Đơn hàng đã được hủy",
    title: "Đơn hàng đã hủy",
    message: "Đơn hàng không còn được tiếp tục xử lý. Bạn có thể liên hệ shop nếu cần hỗ trợ.",
  },
  REFUNDED: {
    subject: "Đơn hàng đã được hoàn tiền",
    title: "Đơn hàng đã hoàn tiền",
    message: "Shop đã cập nhật trạng thái hoàn tiền cho đơn hàng của bạn.",
  },
};

const PAYMENT_CONTENT: Record<PaymentStatus, { subject: string; title: string; message: string }> = {
  PENDING: {
    subject: "Đơn hàng đang chờ thanh toán",
    title: "Thanh toán đang chờ xử lý",
    message: "Shop chưa ghi nhận thanh toán cho đơn hàng này.",
  },
  PAID: {
    subject: "Thanh toán đơn hàng thành công",
    title: "Tiệm Rêu đã nhận thanh toán",
    message: "Thanh toán đã được xác nhận và đơn hàng sẽ được chuẩn bị.",
  },
  FAILED: {
    subject: "Thanh toán đơn hàng chưa thành công",
    title: "Thanh toán chưa hoàn tất",
    message: "Shop chưa thể xác nhận giao dịch. Vui lòng kiểm tra lại hoặc liên hệ shop.",
  },
  REFUNDED: {
    subject: "Thanh toán đã được hoàn lại",
    title: "Đơn hàng đã được hoàn tiền",
    message: "Shop đã cập nhật trạng thái hoàn tiền cho giao dịch của bạn.",
  },
};

function getEventContent(eventType: OrderEmailEvent, payload: Record<string, unknown>) {
  if (eventType === "ORDER_CREATED") {
    return {
      subject: "Tiệm Rêu đã nhận đơn hàng",
      title: "Đặt hàng thành công",
      message: "Tiệm Rêu đã nhận được đơn hàng và sẽ sớm xác nhận với bạn.",
    };
  }

  if (eventType === "PAYMENT_CONFIRMED") {
    return PAYMENT_CONTENT.PAID;
  }

  if (eventType === "ORDER_STATUS_CHANGED") {
    const status = String(payload.status || "PENDING") as OrderStatus;
    return STATUS_CONTENT[status] || STATUS_CONTENT.PENDING;
  }

  const paymentStatus = String(payload.paymentStatus || "PENDING") as PaymentStatus;
  return PAYMENT_CONTENT[paymentStatus] || PAYMENT_CONTENT.PENDING;
}

type OrderEmailRecord = Prisma.OrderEmailNotificationGetPayload<{
  include: {
    order: {
      include: {
        customer: { select: { name: true } };
        items: true;
        shippingInfo: true;
      };
    };
  };
}>;

function buildOrderEmail(notification: OrderEmailRecord) {
  const { order } = notification;
  const payload = asPayload(notification.payload);
  const content = getEventContent(notification.eventType, payload);
  const customerName = order.shippingInfo?.name || order.customer?.name || "bạn";
  const address = [
    order.shippingInfo?.fullAddress,
    order.shippingInfo?.ward,
    order.shippingInfo?.district,
    order.shippingInfo?.province,
  ].filter(Boolean).join(", ");
  const paymentMethod = {
    COD: "Thanh toán khi nhận hàng",
    MOMO: "Ví MoMo",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
  }[order.paymentMethod];
  const detailUrl = order.customerId
    ? `${SITE_URL}/orders/${encodeURIComponent(order.id)}`
    : `${SITE_URL}/checkout/success?orderId=${encodeURIComponent(order.id)}&orderNumber=${encodeURIComponent(order.orderNumber)}`;
  const trackingUrl = order.shippingInfo?.trackingUrl?.startsWith("https://")
    ? order.shippingInfo.trackingUrl
    : null;

  const itemRows = order.items.map((item) => {
    const variants = parseVariants(item.variants);
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:700;color:#171717">${escapeEmailHtml(item.productName)}</div>
          ${variants ? `<div style="margin-top:4px;font-size:13px;color:#737373">${escapeEmailHtml(variants)}</div>` : ""}
          <div style="margin-top:4px;font-size:13px;color:#737373">Số lượng: ${item.quantity}</div>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid #e5e7eb;font-weight:700;color:#171717;white-space:nowrap">
          ${formatMoney(Number(item.price) * item.quantity)}
        </td>
      </tr>`;
  }).join("");

  const shippingQuote = order.shippingQuoteRequired
    ? `<div style="margin:20px 0;padding:14px 16px;border:1px solid #171717;background:#fafafa">
        <strong>Phí vận chuyển ngoài TP.HCM</strong>
        <div style="margin-top:5px;color:#525252;font-size:13px;line-height:1.6">Phí vận chuyển sẽ được trao đổi riêng. Shop sẽ nhắn tin với bạn trước khi giao hàng.</div>
      </div>`
    : "";
  const tracking = order.shippingInfo?.trackingNumber
    ? `<div style="margin-top:16px;font-size:14px"><strong>Mã vận đơn:</strong> ${escapeEmailHtml(order.shippingInfo.trackingNumber)}${trackingUrl ? ` · <a href="${escapeEmailHtml(trackingUrl)}" style="color:#171717">Theo dõi đơn</a>` : ""}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmailHtml(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,'Segoe UI',sans-serif;color:#171717">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;background:#f5f5f5">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb">
        <tr><td style="padding:26px 28px;background:#171717;color:#fff;text-align:center">
          <div style="font-family:Georgia,serif;font-size:25px;font-style:italic">tiệm Rêu Décor</div>
          <div style="margin-top:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#d4d4d4">Terrarium &amp; Moss Art</div>
        </td></tr>
        <tr><td style="padding:30px 28px">
          <div style="font-size:13px;color:#737373">Xin chào ${escapeEmailHtml(customerName)},</div>
          <h1 style="margin:10px 0 8px;font-size:25px;line-height:1.25">${escapeEmailHtml(content.title)}</h1>
          <p style="margin:0;color:#525252;line-height:1.7">${escapeEmailHtml(content.message)}</p>
          <div style="margin:22px 0;padding:16px;background:#fafafa;border:1px solid #e5e7eb">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:13px;color:#737373">Mã đơn hàng</td><td align="right" style="font-weight:700">#${escapeEmailHtml(order.orderNumber)}</td></tr>
              <tr><td style="padding-top:8px;font-size:13px;color:#737373">Ngày đặt</td><td align="right" style="padding-top:8px">${formatDate(order.createdAt)}</td></tr>
            </table>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px">
            <tr><td style="padding:5px 0;color:#737373">Tạm tính</td><td align="right">${formatMoney(order.subtotal)}</td></tr>
            ${Number(order.discount) > 0 ? `<tr><td style="padding:5px 0;color:#737373">Giảm giá</td><td align="right">-${formatMoney(order.discount)}</td></tr>` : ""}
            <tr><td style="padding:5px 0;color:#737373">Phí vận chuyển</td><td align="right">${order.shippingQuoteRequired ? "Trao đổi riêng" : formatMoney(order.shippingFee)}</td></tr>
            <tr><td style="padding:12px 0 0;border-top:1px solid #171717;font-size:16px;font-weight:700">Tổng đơn hàng</td><td align="right" style="padding:12px 0 0;border-top:1px solid #171717;font-size:18px;font-weight:700">${formatMoney(order.total)}</td></tr>
          </table>
          ${shippingQuote}
          <div style="margin-top:20px;font-size:14px;line-height:1.7">
            <div><strong>Thanh toán:</strong> ${escapeEmailHtml(paymentMethod)}</div>
            ${address ? `<div><strong>Giao đến:</strong> ${escapeEmailHtml(address)}</div>` : ""}
          </div>
          ${tracking}
          <div style="margin-top:26px;text-align:center">
            <a href="${escapeEmailHtml(detailUrl)}" style="display:inline-block;padding:13px 24px;background:#171717;color:#fff;text-decoration:none;font-weight:700">Xem chi tiết đơn hàng</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e5e7eb;text-align:center;color:#737373;font-size:12px;line-height:1.6">
          Email tự động từ Tiệm Rêu Decor. Khi cần hỗ trợ, vui lòng dùng mục Tin nhắn trên website.<br>&copy; ${new Date().getFullYear()} Tiệm Rêu Decor.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: `${content.subject} #${order.orderNumber}`,
    html,
  };
}

export async function dispatchOrderEmail(eventKey: string) {
  try {
    const notification = await prisma.orderEmailNotification.findUnique({
      where: { eventKey },
      select: { id: true },
    });
    if (!notification) return { sent: false, reason: "not_queued" as const };

    const staleBefore = new Date(Date.now() - SENDING_LEASE_MINUTES * 60 * 1000);
    const claimed = await prisma.orderEmailNotification.updateMany({
      where: {
        id: notification.id,
        attempts: { lt: MAX_ATTEMPTS },
        OR: [
          { status: { in: ["PENDING", "FAILED"] } },
          { status: "SENDING", lastAttemptAt: { lt: staleBefore } },
        ],
      },
      data: {
        status: "SENDING",
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        lastError: null,
      },
    });
    if (claimed.count !== 1) return { sent: false, reason: "already_claimed" as const };

    const claimedNotification = await prisma.orderEmailNotification.findUnique({
      where: { id: notification.id },
      include: {
        order: {
          include: {
            customer: { select: { name: true } },
            items: true,
            shippingInfo: true,
          },
        },
      },
    });
    if (!claimedNotification) return { sent: false, reason: "not_found" as const };

    const content = buildOrderEmail(claimedNotification);
    const result = await sendTransactionalEmail({
      to: claimedNotification.recipient,
      subject: content.subject,
      html: content.html,
    });

    if (!result.success) {
      await prisma.orderEmailNotification.update({
        where: { id: notification.id },
        data: { status: "FAILED", lastError: result.error.slice(0, 1000) },
      });
      return { sent: false, reason: "provider_error" as const };
    }

    await prisma.orderEmailNotification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        providerMessageId: result.id,
        lastError: null,
      },
    });
    return { sent: true };
  } catch (error) {
    console.error("Order email dispatch failed:", error);
    return { sent: false, reason: "internal_error" as const };
  }
}

export async function dispatchPendingOrderEmails(limit = 20) {
  const notifications = await prisma.orderEmailNotification.findMany({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: { in: ["PENDING", "FAILED"] } },
        {
          status: "SENDING",
          lastAttemptAt: {
            lt: new Date(Date.now() - SENDING_LEASE_MINUTES * 60 * 1000),
          },
        },
      ],
    },
    select: { eventKey: true },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  let sent = 0;
  for (const notification of notifications) {
    const result = await dispatchOrderEmail(notification.eventKey);
    if (result.sent) sent += 1;
  }

  return { processed: notifications.length, sent };
}
