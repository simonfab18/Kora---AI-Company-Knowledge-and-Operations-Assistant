import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${apiBaseUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { status: "error", backendStatus: response.status },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();
    return NextResponse.json({ status: "ok", backend: payload });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Backend health endpoint is not reachable.",
        detail: error instanceof Error ? error.name : "UnknownError",
      },
      { status: 503 },
    );
  }
}
