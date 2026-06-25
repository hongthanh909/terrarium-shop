const BLOCKED_TAGS =
  /<\/?(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math|canvas)[^>]*>/gi;

const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data):/i;
const URL_ATTRS = new Set(["href", "src"]);

function sanitizeAttributes(attrs: string) {
  return attrs.replace(
    /\s([^\s"'<>/=]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
    (_match, rawName: string, _rawValue: string, dq?: string, sq?: string, bare?: string) => {
      const name = rawName.toLowerCase();
      const value = dq ?? sq ?? bare ?? "";

      if (name.startsWith("on")) return "";
      if (name === "style" || name === "srcdoc") return "";
      if (URL_ATTRS.has(name) && DANGEROUS_PROTOCOLS.test(value.trim())) return "";

      const escapedValue = value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (!value && _rawValue == null) return ` ${name}`;
      return ` ${name}="${escapedValue}"`;
    }
  );
}

export function sanitizeHtml(html: string | null | undefined) {
  if (!html) return "";

  return String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(BLOCKED_TAGS, "")
    .replace(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (_match, tag: string, attrs: string) => {
      return `<${tag.toLowerCase()}${sanitizeAttributes(attrs)}>`;
    });
}

export function sanitizePlainTextWithBreaks(text: string | null | undefined) {
  return sanitizeHtml(
    String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")
  );
}
