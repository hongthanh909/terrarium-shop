export const SHOP_FORUM_ENABLED =
  process.env.NEXT_PUBLIC_SHOP_FORUM_ENABLED === "true";

// AI is opt-in so a missing environment variable can never enable it by accident.
export const AI_CHAT_ENABLED =
  process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";
