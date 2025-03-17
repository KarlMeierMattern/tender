import { NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import { scrapeTenders } from "@/app/lib/scrapers";
import { scrapeTendersDetail } from "@/app/lib/scrapers";

export async function getTenders() {
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

export async function getTendersDetail() {
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
