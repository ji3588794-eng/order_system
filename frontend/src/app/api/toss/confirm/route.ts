import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { paymentKey, orderId, amount, localOrderId } = await request.json();

  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({ message: "토스 시크릿 키가 없습니다." }, { status: 500 });
  }

  const encryptedSecretKey = "Basic " + Buffer.from(secretKey + ":").toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: encryptedSecretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  if (localOrderId) {
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
    const backendRes = await fetch(`${apiBaseUrl}/api/orders/${localOrderId}/toss-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
        approvedAt: data.approvedAt,
        receiptUrl: data.receipt?.url,
        rawPayload: data,
      }),
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(backendData, { status: backendRes.status });
    }
  }

  return NextResponse.json(data);
}
