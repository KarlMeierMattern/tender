import { NextResponse } from "next/server";
import { scrapeTendersDetail } from "@/app/lib/scrapers/tenders-detail";
import { StatusCodes } from "http-status-codes";

export async function GET() {
  try {
    const tenders = await scrapeTendersDetail();
    return NextResponse.json({ success: true, data: tenders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
