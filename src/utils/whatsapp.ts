export function buildWhatsAppMessage({
  payerName,
  amount,
  purpose,
  paymentLink,
}: {
  payerName: string;
  amount: number;
  purpose: string;
  paymentLink: string;
}) {
  return `
Hi 👋

You have a payment request.

💰 Amount: ₹${amount}
📝 For: ${purpose}

Please pay using the link below:
${paymentLink}

After payment, confirm on the page.

Thanks 🙂
`.trim();
}

export function openWhatsApp(phone: string, message: string) {
  const encoded = encodeURIComponent(message);

  const url = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, "_blank");
}
