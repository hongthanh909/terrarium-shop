"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

type ChatAutoScrollOptions = {
  conversationId: string | null;
  latestMessageId: string | null;
  loading: boolean;
  sending: boolean;
};

export function useChatAutoScroll({
  conversationId,
  latestMessageId,
  loading,
  sending,
}: ChatAutoScrollOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scroll = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };

    scroll();
    requestAnimationFrame(() => {
      scroll();
      requestAnimationFrame(scroll);
    });
  }, []);

  useLayoutEffect(() => {
    if (!conversationId || loading) return;

    scrollToLatest();

    const content = viewportRef.current?.firstElementChild;
    if (!content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(scrollToLatest);
    observer.observe(content);
    return () => observer.disconnect();
  }, [conversationId, latestMessageId, loading, sending, scrollToLatest]);

  return viewportRef;
}
