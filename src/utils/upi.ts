// src/utils/upi.ts

export type UpiApp = "ANY" | "GPAY" | "PHONEPE" | "PAYTM";

export interface GenerateUpiLinkParams {
  app: UpiApp;
  payeeUpiId: string;   // example: yourupi@bank
  payeeName: string;    // example: Your Name
  amount: number;       // amount in INR
  note: string;         // transaction note
}

/**
 * Generate UPI deep link for different apps
 */
export function generateUpiLink({
  app,
  payeeUpiId,
  payeeName,
  amount,
  note,
}: GenerateUpiLinkParams): string {
  let base: string;

  switch (app) {
    case "GPAY":
      base = "tez://upi/pay";
      break;
    case "PHONEPE":
      base = "phonepe://pay";
      break;
    case "PAYTM":
      base = "paytmmp://pay";
      break;
    default:
      base = "upi://pay"; // generic UPI chooser
  }

  const params = new URLSearchParams({
    pa: payeeUpiId,
    pn: payeeName,
    am: amount.toFixed(2), // always 2 decimals
    cu: "INR",
    tn: note,
  });

  return `${base}?${params.toString()}`;
}

/**
 * Validate UPI ID format
 * Examples:
 *  - name@bank
 *  - user.name@okaxis
 */
export function isValidUpi(upi: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(
    upi.trim()
  );
}

/**
 * Detect if current device is mobile
 * (UPI apps only open on mobile)
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
