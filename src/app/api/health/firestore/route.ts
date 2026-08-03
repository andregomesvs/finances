import { NextResponse } from "next/server";
import { getFirestoreDatabase } from "@/infrastructure/firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getFirestoreDatabase().collection("_health").limit(1).get();

    return NextResponse.json({ service: "firestore", status: "ok" });
  } catch (error) {
    console.error("Firestore health check failed", error);

    return NextResponse.json(
      { service: "firestore", status: "unavailable" },
      { status: 503 },
    );
  }
}
