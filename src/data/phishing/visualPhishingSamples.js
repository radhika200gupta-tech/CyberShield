// Base64 SVGs to simulate phishing screenshots for the demo mode

const generateFakeScreenshot = (title, bodyText, url, buttonText) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" style="background-color:#ffffff;font-family:Arial,sans-serif">
    <rect width="800" height="40" fill="#f1f3f4"/>
    <text x="20" y="25" font-size="14" fill="#333">${url}</text>
    <rect x="0" y="40" width="800" height="560" fill="#f8f9fa"/>
    <rect x="200" y="100" width="400" height="350" fill="#ffffff" stroke="#e0e0e0" rx="8"/>
    <text x="400" y="160" font-size="24" fill="#202124" text-anchor="middle" font-weight="bold">${title}</text>
    <foreignObject x="240" y="200" width="320" height="150">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:16px;color:#5f6368;text-align:center;line-height:1.5;">
        ${bodyText}
      </div>
    </foreignObject>
    <rect x="300" y="360" width="200" height="40" fill="#1a73e8" rx="4"/>
    <text x="400" y="385" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">${buttonText}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

export const DEMO_SAMPLES = [
  {
    id: 'demo-google',
    name: 'Fake Google Verification',
    type: 'HIGH',
    src: generateFakeScreenshot(
      'Security Alert',
      'We detected an unusual login attempt from a new device. Please verify your account immediately or it will be suspended within 24 hours.',
      'https://accounts-google-verify.security-update.xyz',
      'Verify Account'
    )
  },
  {
    id: 'demo-bank',
    name: 'Fake Bank Alert',
    type: 'CRITICAL',
    src: generateFakeScreenshot(
      'Payment Declined',
      'Your recent wire transfer of $1,450.00 was declined due to missing credentials. Please confirm your debit card details to process the refund.',
      'http://chase-bank.refund-portal.t.co/login',
      'Login to Bank'
    )
  },
  {
    id: 'demo-microsoft',
    name: 'Fake Microsoft Login',
    type: 'HIGH',
    src: generateFakeScreenshot(
      'Sign In',
      'Your Office 365 password expires today. You must act now to retain access to your emails.',
      'http://login.microsoftonline.com.secure-auth-gateway.top',
      'Update Password'
    )
  },
  {
    id: 'demo-safe',
    name: 'Safe Newsletter',
    type: 'LOW',
    src: generateFakeScreenshot(
      'Weekly Tech Digest',
      'Welcome to this week’s newsletter! Here are the top 5 cybersecurity trends you need to know about.',
      'https://www.techdigest.com/newsletter/102',
      'Read Article'
    )
  }
];

export async function convertDataUrlToFile(dataUrl, filename) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/svg+xml' });
}
