import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // TODO: Integrate with Ollama AI
    // For now, return a placeholder response
    const response = `Cảm ơn câu hỏi của bạn: "${message}". Đây là placeholder response. Tính năng AI Chat sẽ được tích hợp với Ollama trong tương lai.`;

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}