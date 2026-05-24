import { prisma } from "@/lib/prisma";


export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE";

/**
 * Ghi lại thao tác của Admin vào bảng AuditLog
 */
export async function logAdminAction(
  userId: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  } catch (error) {
    console.error("Lỗi khi ghi AuditLog:", error);
    // Không throw error để tránh làm gián đoạn flow chính
  }
}
