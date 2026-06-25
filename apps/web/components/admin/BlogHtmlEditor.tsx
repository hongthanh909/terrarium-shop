"use client";

import { useRef, useState } from "react";

type BlogHtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeightClass?: string;
};

const toolbar = [
  { label: "H2", before: "<h2>", after: "</h2>" },
  { label: "H3", before: "<h3>", after: "</h3>" },
  { label: "B", before: "<strong>", after: "</strong>" },
  { label: "I", before: "<em>", after: "</em>" },
  { label: "P", before: "<p>", after: "</p>" },
  { label: "UL", before: "<ul><li>", after: "</li></ul>" },
  { label: "Link", before: '<a href="https://" target="_blank" rel="noopener noreferrer">', after: "</a>" },
];

export function BlogHtmlEditor({
  value,
  onChange,
  minHeightClass = "h-44",
}: BlogHtmlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || "Nội dung";
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;

    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50 px-2 py-2">
        {toolbar.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => wrapSelection(item.before, item.after)}
            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-[#425733]/40 hover:text-[#425733]"
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="ml-auto rounded-md border border-[#daebd0] bg-[#f0f5ec] px-2.5 py-1 text-xs font-semibold text-[#425733] hover:bg-[#e3ebdd]"
        >
          {showPreview ? "Sửa HTML" : "Xem trước"}
        </button>
      </div>

      {showPreview ? (
        <div
          className={`${minHeightClass} prose prose-sm max-w-none overflow-auto p-4 text-gray-700`}
          dangerouslySetInnerHTML={{ __html: value || "<p class='text-gray-400'>Chưa có nội dung</p>" }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${minHeightClass} w-full resize-y border-0 p-4 font-mono text-sm leading-6 outline-none focus:ring-0`}
          placeholder="Nhập nội dung HTML. Có thể dùng các nút phía trên để chèn thẻ nhanh."
        />
      )}
    </div>
  );
}
