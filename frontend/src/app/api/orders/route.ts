import { NextResponse } from "next/server";

const getApiBaseUrl = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
