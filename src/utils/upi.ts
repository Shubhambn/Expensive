interface UpiParams {
  payeeUpiId: string;   // your UPI ID
  payeeName: string;    // your name
  amount: number;
  note: string;
}

export function generateUpiLink({
  app,
  payeeUpiId,
  payeeName,
  amount,
  note,
}: {
  app: "ANY" | "GPAY" | "PHONEPE" | "PAYTM";
  payeeUpiId: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  const base =
    app === "GPAY"
      ? "tez://upi/pay"
      : app === "PHONEPE"
      ? "phonepe://pay"
      : app === "PAYTM"
      ? "paytmmp://pay"
      : "upi://pay";

  const params = new URLSearchParams({
    pa: payeeUpiId,
    pn: payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: note,
  });

  return `${base}?${params.toString()}`;
}

