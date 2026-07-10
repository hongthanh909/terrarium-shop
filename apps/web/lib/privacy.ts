export function maskEmail(email?: string | null) {
  if (!email) return email;
  const [name, domain] = email.split("@");
  if (!name || !domain) return "***";
  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

export function maskPhone(phone?: string | null) {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

export function maskBankAccount(account?: string | null) {
  if (!account) return account;
  const cleaned = account.replace(/\s/g, "");
  if (cleaned.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, cleaned.length - 4))}${cleaned.slice(-4)}`;
}

export function maskSensitiveSettings(settings: Record<string, any>) {
  return {
    ...settings,
    shopEmail: maskEmail(settings.shopEmail),
    shopPhone: maskPhone(settings.shopPhone),
    bankAccountNumber: maskBankAccount(settings.bankAccountNumber),
  };
}
