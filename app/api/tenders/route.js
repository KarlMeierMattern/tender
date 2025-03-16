import { NextResponse } from "next/server";
import { scrapeTenders } from "@/app/lib/scrapers/tenders";
import { StatusCodes } from "http-status-codes";

export async function GET() {
  try {
    const tenders = await scrapeTenders();
    return NextResponse.json({ success: true, data: tenders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
