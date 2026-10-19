/**
 * Generate test screenshots dynamically via HTML Canvas for 1-click testing in the Visual Phishing Lab.
 */
export function generateSampleScreenshot(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  if (type === 'urgent-bank') {
    // 1. Dark banking alert simulated email / notification
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header banner
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, canvas.width, 8);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 30, 640, 420);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 30, 640, 420);

    // Header Title
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('SECURITY ALERT: Action Required Immediately', 70, 75);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('From: security-verification@bank-security-support.xyz', 70, 105);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(70, 120);
    ctx.lineTo(650, 120);
    ctx.stroke();

    // Body text
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Dear Customer,', 70, 155);
    ctx.fillText('Unauthorized access detected on your account from an unrecognized device.', 70, 185);
    ctx.fillText('Your account will be suspended within 24 hours unless you verify identity.', 70, 215);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('Please verify your account and enter your password and OTP verification code.', 70, 255);

    // Call-to-action button
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(70, 285, 260, 44, 8) : ctx.rect(70, 285, 260, 44);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('CONFIRM ACCOUNT LOGIN', 90, 312);

    // Suspicious Link info
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Courier New, monospace';
    ctx.fillText('Destination: http://bit.ly/secure-auth-update-xyz', 70, 360);
    ctx.fillText('Ref ID: 894-201-98 // Bank Fraud Prevention Department', 70, 385);

  } else if (type === 'it-helpdesk') {
    // 2. Corporate IT Password Expired Alert
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.fillRect(40, 30, 640, 420);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 30, 640, 420);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('IT Support Desk - Password Expiration Notice', 70, 75);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('Notice from: system administrator <admin@corporate-helpdesk.top>', 70, 105);

    ctx.strokeStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(70, 120);
    ctx.lineTo(650, 120);
    ctx.stroke();

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Urgent notice: Your corporate Microsoft 365 password expires today.', 70, 155);
    ctx.fillText('To prevent disruption and account closure, enter your current password', 70, 185);
    ctx.fillText('and submit your 6-digit authentication code immediately.', 70, 215);

    // Call to action
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(70, 255, 240, 44, 8) : ctx.rect(70, 255, 240, 44);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('UPDATE PASSWORD NOW', 95, 282);

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Courier New, monospace';
    ctx.fillText('Link: http://tinyurl.com/ad-login-sync', 70, 335);
    ctx.fillText('IT Support Department // Internal Compliance Team', 70, 360);

  } else {
    // 3. Clean, safe order confirmation receipt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 30, 640, 420);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 30, 640, 420);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('Order Confirmation & Receipt #48291', 70, 75);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('Merchant: TechSupplies Global Online Store', 70, 105);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(70, 120);
    ctx.lineTo(650, 120);
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Thank you for your purchase. Your order has been processed.', 70, 155);
    ctx.fillText('Estimated delivery: 3 to 5 business days via standard courier.', 70, 185);
    ctx.fillText('Items: 1x Ergonomic Keyboard ($89.00), 1x USB Cable ($12.00).', 70, 215);
    ctx.fillText('Total Paid: $101.00 via standard checkout.', 70, 245);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('No action is needed on your part. Keep this receipt for your records.', 70, 290);
    ctx.fillText('You can view tracking updates in your account at https://www.techsupplies.com', 70, 320);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('Customer Support: support@techsupplies.com', 70, 365);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const fileName = `sample-${type}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}
