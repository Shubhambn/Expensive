interface UpiParams {
  payeeUpiId: string;   // your UPI ID
  payeeName: string;    // your name
  amount: number;
  note: string;
}

export function generateUpiLink({
  payeeUpiId,
  payeeName,
  amount,
  note,
}: UpiParams): string {
  const params = new URLSearchParams({
    pa: payeeUpiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
}
