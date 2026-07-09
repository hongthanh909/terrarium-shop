type ChatRole = "system" | "user" | "assistant";

export type AiChatMessage = {
  role: ChatRole | string;
  content: string;
};

type StreamFromOpenAIOptions = {
  systemPrompt: string;
  messages: AiChatMessage[];
  model?: string;
  apiKey?: string;
  onDone?: () => void;
};

function escapeJsonString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function toResponsesInput(messages: AiChatMessage[]) {
  return messages
    .filter((message) => message.role !== "system" && message.content.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));
}

export async function streamFromOpenAI({
  systemPrompt,
  messages,
  model = "gpt-5-mini",
  apiKey = process.env.OPENAI_API_KEY,
  onDone,
}: StreamFromOpenAIOptions): Promise<ReadableStream<Uint8Array> | null> {
  if (!apiKey) {
    console.log("[AI] OpenAI skipped: missing OPENAI_API_KEY");
    return null;
  }

  console.log(`[AI] Trying OpenAI (model: ${model})...`);

  const abortCtrl = new AbortController();
  const timeout = setTimeout(() => abortCtrl.abort(), 25_000);

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input: toResponsesInput(messages),
        stream: true,
        max_output_tokens: 420,
      }),
      signal: abortCtrl.signal,
    });
    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      const details = await res.text().catch(() => "");
      console.error(`[AI] OpenAI error: ${res.status} ${details.slice(0, 240)}`);
      return null;
    }

    console.log("[AI] OpenAI connected, streaming...");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      onDone?.();
    };

    return new ReadableStream({
      async pull(ctrl) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            finish();
            ctrl.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventBlock of events) {
            const dataLines = eventBlock
              .split("\n")
              .filter((line) => line.startsWith("data: "))
              .map((line) => line.slice(6).trim());

            for (const data of dataLines) {
              if (!data || data === "[DONE]") continue;
              try {
                const event = JSON.parse(data);
                if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                  ctrl.enqueue(encoder.encode(`data: {"token":"${escapeJsonString(event.delta)}"}\n\n`));
                }
              } catch {
                // Ignore malformed event chunks.
              }
            }
          }
        } catch (err) {
          console.error("[AI] OpenAI stream error:", err);
          finish();
          ctrl.close();
        }
      },
      cancel() {
        finish();
        reader.cancel().catch(() => {});
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("[AI] OpenAI fetch error:", err);
    return null;
  }
}

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();

  const chunks: string[] = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") chunks.push(content.text);
    }
  }

  return chunks.join("").trim();
}

export async function completeFromOpenAI({
  systemPrompt,
  messages,
  model = "gpt-5-mini",
  apiKey = process.env.OPENAI_API_KEY,
}: Omit<StreamFromOpenAIOptions, "onDone">): Promise<string | null> {
  if (!apiKey) {
    console.log("[AI] OpenAI completion skipped: missing OPENAI_API_KEY");
    return null;
  }

  const abortCtrl = new AbortController();
  const timeout = setTimeout(() => abortCtrl.abort(), 20_000);

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input: toResponsesInput(messages),
        stream: false,
        max_output_tokens: 420,
      }),
      signal: abortCtrl.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      console.error(`[AI] OpenAI completion error: ${res.status} ${details.slice(0, 240)}`);
      return null;
    }

    const payload = await res.json();
    const text = extractResponseText(payload);
    if (!text) {
      console.error(`[AI] OpenAI completion empty response for model ${model}; status=${payload?.status || "unknown"}`);
      return null;
    }

    return text;
  } catch (err) {
    clearTimeout(timeout);
    console.error("[AI] OpenAI completion fetch error:", err);
    return null;
  }
}
