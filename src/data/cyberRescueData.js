/**
 * CyberRescue Data & Interactive Tools Configuration
 * 
 * Contains incident recovery scenarios, urgent first actions, actionable recovery steps,
 * and structured guidance configurations for incident-specific interactive tools.
 */

export const EMERGENCY_INFO = {
  helpline: '1930',
  helplineUrl: 'tel:1930',
  portalUrl: 'https://cybercrime.gov.in/',
  portalName: 'cybercrime.gov.in',
};

export const RESCUE_SCENARIOS = [
  {
    id: 'phishing-link',
    title: 'Clicked a phishing link',
    description: 'You clicked an unknown or suspicious link from an SMS, email, or chat message.',
    icon: 'link',
    urgentAction: {
      title: 'Disconnect Internet Connectivity Right Away',
      instruction: 'Immediately turn off Wi-Fi and mobile data (or toggle Airplane Mode) on your device. This halts ongoing malicious background downloads, unauthorized scripts, and communication with the attacker’s command server.',
    },
    steps: [
      'Turn off Wi-Fi and mobile data immediately (or switch on Airplane Mode) to cut off communication with the attacker’s server.',
      'Open your browser downloads folder and delete any recently downloaded suspicious files (such as .apk, .exe, .bat, or .zip files) without opening them.',
      'Clear your browser cache, cookies, and browsing history from your browser settings to terminate compromised sessions and malicious trackers.',
      'Run a comprehensive security scan using a trusted antivirus or built-in scanner (such as Google Play Protect on Android or Windows Defender).',
      'Monitor your email and financial accounts for unusual login attempts or security alerts, and change passwords if you entered any information.',
    ],
  },
  {
    id: 'entered-password',
    title: 'Entered a password on a suspicious website',
    description: 'You submitted your login password or credentials on a fake, spoofed, or unverified webpage.',
    icon: 'lock',
    urgentAction: {
      title: 'Change Password & Terminate All Active Sessions Immediately',
      instruction: 'Go to the genuine official website directly in a separate browser tab right now. Change your password, and choose "Log out of all devices/sessions" to revoke the attacker’s access immediately.',
    },
    steps: [
      'Visit the legitimate official website or app directly (type the official URL yourself) and change your password to a strong, unique passphrase.',
      'Navigate to account security settings and select "Log out of all other sessions/devices" to terminate active login sessions held by the scammer.',
      'If you reused this password across any other accounts (email, banking, shopping, social media), change the password on each of those accounts immediately.',
      'Enable Two-Factor Authentication (2FA), preferably using an Authenticator app (e.g. Google Authenticator) rather than SMS.',
      'Inspect your account profile and recovery settings (backup email address, security questions, and phone number) to ensure the attacker did not alter them.',
    ],
  },
  {
    id: 'shared-otp',
    title: 'Shared an OTP',
    description: 'You mistakenly shared a One-Time Password with someone over a phone call, chat, or form.',
    icon: 'phone',
    urgentAction: {
      title: 'Determine OTP Type & Block Access Instantly',
      instruction: 'If you shared a banking or payment OTP, call your bank helpline or use your mobile banking app to freeze your card and UPI immediately. If you shared a messaging app OTP (e.g., WhatsApp), immediately re-register your number and log out all linked devices.',
    },
    steps: [
      'Banking/Payment OTP: Call your bank’s 24/7 emergency fraud helpline or log in to your official mobile banking app to temporarily block your debit card, credit card, and UPI access.',
      'Messaging App OTP (WhatsApp/Telegram): Open WhatsApp > Settings > Linked Devices, log out of all active web/desktop sessions, and re-verify your phone number using SMS.',
      'Turn on or reset Two-Step Verification (with a secret 6-digit PIN) inside your messaging and email apps so the attacker cannot log back in with SMS alone.',
      'Notify your close contacts, family, and group chats via phone call that your account was targeted, warning them not to send money or click links from your number.',
      'Check that call forwarding and SMS forwarding are not active on your phone (dial ##002# on GSM carriers like Jio, Airtel, and Vi to cancel all unconditional forwarding).',
      'Report the scammer’s phone number and the incident to India’s official cybercrime reporting portal at https://cybercrime.gov.in/.',
    ],
  },
  {
    id: 'fraudulent-payment',
    title: 'Made a fraudulent payment',
    description: 'You transferred money or approved an unauthorized UPI / card / net banking transaction to a fraudster.',
    icon: 'alert',
    urgentAction: {
      title: 'Call 1930 & Contact Your Bank Immediately (Golden Hour)',
      instruction: 'Dial India’s National Cyber Financial Fraud Helpline at 1930 right away. Reporting within the first 2-3 hours enables law enforcement and banks to freeze the stolen funds in the scammer’s account before withdrawal.',
    },
    steps: [
      'Call the National Cyber Financial Fraud Helpline at 1930 immediately — prompt reporting during the "Golden Hour" allows banks to trace and freeze the recipient account.',
      'Contact your issuing bank or payment provider (PhonePe, Google Pay, Paytm, or card issuer) immediately to report the unauthorized transaction and freeze further debits.',
      'Preserve all critical transaction evidence: copy the Transaction ID, UTR number, UPI Reference ID, recipient account/UPI ID, debit SMS, and save payment screenshots.',
      'Lodge an official financial fraud complaint on the National Cyber Crime Reporting Portal at https://cybercrime.gov.in/ with your evidence and transaction reference numbers.',
      'Submit a written dispute form (chargeback request) along with a printed copy of your cyber complaint acknowledgement to your home bank branch within 3 days.',
    ],
  },
];

/**
 * Incident A: Suspicious Link Pattern Analyzer
 * Performs safe client-side syntactic and structural pattern heuristics.
 */
export function analyzeSuspiciousLink(inputUrl) {
  if (!inputUrl || !inputUrl.trim()) {
    return { error: 'Please enter or paste a web address (URL) to analyze.' };
  }

  const raw = inputUrl.trim();

  // Basic check for whitespace
  if (/\s/.test(raw)) {
    return { error: 'URL contains whitespace. Please enter a valid, continuous web address.' };
  }

  let parsed;
  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    const toParse = hasProtocol ? raw : `https://${raw}`;
    parsed = new URL(toParse);

    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return { error: 'Invalid URL format. Please provide a valid domain (e.g. example.com or https://site.com).' };
    }
  } catch {
    return { error: 'Unable to parse the provided URL. Please verify the web address format and try again.' };
  }

  const flags = [];
  const domain = parsed.hostname.toLowerCase();
  const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();

  // 1. Insecure HTTP Connection
  if (parsed.protocol === 'http:') {
    flags.push({
      level: 'warning',
      title: 'Insecure Connection (HTTP)',
      desc: 'This address uses plain unencrypted HTTP. Legitimate banking, payment, and login portals require encrypted HTTPS.',
    });
  }

  // 2. Numerical IP Address as Hostname
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain) || (domain.startsWith('[') && domain.endsWith(']'));
  if (isIp) {
    flags.push({
      level: 'danger',
      title: 'Numerical IP Address Hostname',
      desc: 'The link points directly to a raw IP address rather than a verified registered domain. Phishing kits frequently operate directly on IP hosts.',
    });
  }

  // 3. Userinfo / @ symbol in URL
  if (parsed.username || raw.includes('@')) {
    flags.push({
      level: 'danger',
      title: 'Misleading "@" Userinfo Pattern',
      desc: 'The URL contains an "@" symbol. Standard web browsers ignore everything prior to "@", redirecting you to an unexpected host.',
    });
  }

  // 4. High-risk or abused TLDs
  const highRiskTlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.fit', '.work', '.icu', '.link', '.cc', '.click', '.rest', '.country', '.stream', '.kim'];
  const matchedTld = highRiskTlds.find((tld) => domain.endsWith(tld));
  if (matchedTld) {
    flags.push({
      level: 'warning',
      title: `Unusual / High-Risk Extension (${matchedTld})`,
      desc: `The top-level domain extension "${matchedTld}" is frequently utilized in temporary disposable phishing setups.`,
    });
  }

  // 5. Brand Impersonation in Subdomains
  const brands = ['sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'google', 'microsoft', 'apple', 'netflix', 'amazon', 'paypal', 'whatsapp', 'facebook', 'instagram', 'bank'];
  const domainParts = domain.split('.');
  const primaryDomain = domainParts.slice(-2).join('.');
  const subdomains = domainParts.slice(0, -2).join('.');
  const brandFoundInSubdomain = brands.some((b) => subdomains.includes(b) && !primaryDomain.includes(b));
  if (brandFoundInSubdomain) {
    flags.push({
      level: 'danger',
      title: 'Brand Impersonation in Subdomain',
      desc: `A recognizable brand name appears in the subdomains, but the genuine destination domain is "${primaryDomain}".`,
    });
  }

  // 6. Suspicious Phishing Keywords in Domain or Path
  const keywords = ['verify', 'verification', 'security-alert', 'signin', 'login', 'update-kyc', 'kyc', 'otp', 'reward', 'free-gift', 'prize', 'claim', 'blocked-account', 'unfreeze'];
  const matchedKeywords = keywords.filter((kw) => domain.includes(kw) || pathAndQuery.includes(kw));
  if (matchedKeywords.length > 0) {
    flags.push({
      level: 'warning',
      title: 'High-Urgency / Phishing Trigger Keywords',
      desc: `Contains keywords frequently seen in credential harvesting traps: ${matchedKeywords.slice(0, 3).join(', ')}.`,
    });
  }

  // 7. Excessive Hyphens in Domain
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    flags.push({
      level: 'warning',
      title: 'Multiple Hyphens in Hostname',
      desc: 'The domain combines three or more hyphens, an indicator often used to disguise fake URLs as authentic services.',
    });
  }

  // 8. Punycode / Homograph (xn--)
  if (domain.startsWith('xn--') || domain.includes('.xn--')) {
    flags.push({
      level: 'danger',
      title: 'Punycode / Homograph Character Encoding (xn--)',
      desc: 'The domain uses encoded Punycode characters that can visually impersonate Latin letters (e.g. Cyrillic letters looking identical).',
    });
  }

  // Determine overall risk category
  let riskCategory = 'Low Pattern Risk';
  let riskColor = 'text-success';
  let badgeClass = 'bg-success/10 text-success border-success/30';

  const dangerCount = flags.filter((f) => f.level === 'danger').length;
  const warningCount = flags.filter((f) => f.level === 'warning').length;

  if (dangerCount > 0 || warningCount >= 2) {
    riskCategory = 'Elevated Risk Patterns';
    riskColor = 'text-danger';
    badgeClass = 'bg-danger/10 text-danger border-danger/30';
  } else if (warningCount === 1) {
    riskCategory = 'Moderate Caution';
    riskColor = 'text-warning';
    badgeClass = 'bg-warning/10 text-warning border-warning/30';
  }

  return {
    parsedUrl: parsed.href,
    domain: parsed.hostname,
    protocol: parsed.protocol,
    flags,
    riskCategory,
    riskColor,
    badgeClass,
    precautions: [
      'Never submit login passwords, OTPs, or debit/credit card numbers on unverified links.',
      'Do not download attachments, APK files, or security profiles prompted by this website.',
      'Open the official service directly by typing its verified website or using its official mobile application.',
    ],
    disclaimer: 'Notice: This tool performs basic client-side syntactic pattern checks. It cannot verify whether a website is completely safe or malicious without a live threat-intelligence API. When in doubt, never visit or interact with suspicious links.',
  };
}

/**
 * Incident B: Account Security Assistant Options
 */
export const ACCOUNT_SECURITY_ACTIONS = {
  email: {
    id: 'email',
    label: 'Email Account',
    sublabel: 'Gmail, Microsoft Outlook, Yahoo, Apple ID',
    summary: 'Email is your primary identity anchor. Compromising email allows attackers to initiate password resets across all your online accounts.',
    priorityActions: [
      {
        priority: '1. Critical',
        title: 'Change Password via Official Website',
        action: 'Navigate directly to your provider (e.g., mail.google.com or outlook.live.com). Never click links in emails to reset your password.',
      },
      {
        priority: '2. Immediate',
        title: 'Sign Out All Other Active Devices & Sessions',
        action: 'In your account security dashboard (e.g., myaccount.google.com/security), select "Manage all devices" and sign out of all unfamiliar sessions.',
      },
      {
        priority: '3. Essential',
        title: 'Audit Forwarding & Mail Filter Rules',
        action: 'Attackers frequently create silent forwarding rules to intercept your future OTPs and verification notices. Review Settings > Forwarding & POP/IMAP.',
      },
      {
        priority: '4. Defense',
        title: 'Enable Two-Factor Authentication (Authenticator App)',
        action: 'Activate 2FA using Google Authenticator or Microsoft Authenticator instead of SMS codes to protect against SIM-swap attacks.',
      },
      {
        priority: '5. Audit',
        title: 'Check Recovery Phone & Email Address',
        action: 'Confirm that your recovery mobile number and backup email address still belong to you and have not been modified.',
      },
    ],
  },
  social: {
    id: 'social',
    label: 'Social Media',
    sublabel: 'Instagram, Facebook, X (Twitter), LinkedIn',
    summary: 'Social media compromises are typically used to impersonate you, scam your followers, or distribute fraudulent investment links.',
    priorityActions: [
      {
        priority: '1. Critical',
        title: 'Change Password in the Official App',
        action: 'Open your mobile app or visit the verified platform directly and update your password to a strong, unique passphrase.',
      },
      {
        priority: '2. Immediate',
        title: 'Terminate All Unknown Login Sessions',
        action: 'Go to Settings > Accounts Center / Security > "Where you’re logged in", and disconnect every unfamiliar device or geographic location.',
      },
      {
        priority: '3. Essential',
        title: 'Enable Two-Factor Authentication (2FA)',
        action: 'Turn on 2FA in security settings and securely note down your single-use emergency backup recovery codes.',
      },
      {
        priority: '4. Defense',
        title: 'Revoke Unknown Third-Party App Permissions',
        action: 'Navigate to Settings > Apps and Websites. Disconnect any unrecognized third-party integrations, game linkings, or tools.',
      },
      {
        priority: '5. Alert',
        title: 'Warn Your Close Contacts & Followers',
        action: 'Post a story or call close friends to alert them that any emergency financial requests or investment links sent from your profile are fraudulent.',
      },
    ],
  },
  banking: {
    id: 'banking',
    label: 'Banking & Financial',
    sublabel: 'NetBanking, Credit Cards, Demat, Crypto',
    summary: 'Financial credential exposure requires immediate emergency measures to safeguard your bank accounts, cards, and credit lines.',
    priorityActions: [
      {
        priority: '1. EMERGENCY',
        title: 'Call Bank Fraud Helpline & Freeze Cards',
        action: 'Call the emergency toll-free number printed on the back of your card or call 1930 immediately to block cards, net banking, and UPI transactions.',
      },
      {
        priority: '2. Immediate',
        title: 'Reset Login & Transaction Passwords',
        action: 'Log in from a clean, secure device to change both your NetBanking Login Password and Transaction PIN/Password.',
      },
      {
        priority: '3. Essential',
        title: 'Disable Online & International Transaction Limits',
        action: 'Inside your official banking app (YONO, iMobile, HDFC, Axis, etc.), toggle off e-commerce and international debit/credit card usage.',
      },
      {
        priority: '4. Audit',
        title: 'Review Recent Mini-Statement & Beneficiaries',
        action: 'Check your mini-statement for test debits, and verify that no unauthorized new payees or beneficiaries were scheduled.',
      },
      {
        priority: '5. Reporting',
        title: 'Lodge Official Cyber Fraud Complaint',
        action: 'File a complaint at https://cybercrime.gov.in/ and obtain an acknowledgement reference for your home bank branch.',
      },
    ],
  },
  other: {
    id: 'other',
    label: 'Other Accounts',
    sublabel: 'Shopping, Utility, College Portal, Gaming',
    summary: 'Secondary services often store saved payment options, delivery addresses, and shared passwords that attackers test across major websites.',
    priorityActions: [
      {
        priority: '1. Immediate',
        title: 'Reset Password on the Official Service',
        action: 'Access the genuine website or official application and update the account password immediately.',
      },
      {
        priority: '2. Critical',
        title: 'Change Passwords on Other Accounts with Shared Passwords',
        action: 'If you reused this exact password on your email, banking, or primary services, update those accounts with distinct passwords right away.',
      },
      {
        priority: '3. Defense',
        title: 'Remove Stored Cards & Autopay Mandates',
        action: 'Delete saved debit/credit cards and active UPI autopay mandates from the compromised platform.',
      },
      {
        priority: '4. Audit',
        title: 'Review Recent Order History & Delivery Addresses',
        action: 'Verify that no unauthorized purchases, digital gift cards, or address modifications were registered.',
      },
    ],
  },
};

/**
 * Incident C: OTP Response Guide Options
 */
export const OTP_GUIDES = {
  banking: {
    id: 'banking',
    label: 'Banking / Payment OTP',
    badge: 'Immediate Financial Threat',
    badgeColor: 'text-danger bg-danger/10 border-danger/30',
    description: 'An OTP sent for debit card authorization, UPI verification, fund transfer, or cash withdrawal.',
    actions: [
      {
        step: 1,
        title: 'Call Bank Fraud Helpline Right Now',
        desc: 'Call the 24/7 emergency toll-free number on the back of your card or your bank’s fraud desk to block the card, UPI ID, and net banking.',
      },
      {
        step: 2,
        title: 'Check Statements for Unauthorized Debits',
        desc: 'Open your official banking app and check your balance. Look for unexpected debits, beneficiary UPI IDs, or IMPS reference numbers.',
      },
      {
        step: 3,
        title: 'Dial 1930 (Cyber Fraud Helpline)',
        desc: 'If money was debited, call 1930 immediately. Rapid reporting during the "Golden Hour" allows banks to freeze the funds before withdrawal.',
      },
      {
        step: 4,
        title: 'Disable Online / Card Transactions in App',
        desc: 'In your mobile banking app, toggle OFF e-commerce and international card usage until a replacement card is issued.',
      },
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp / Messaging OTP',
    badge: 'Account Hijack Threat',
    badgeColor: 'text-warning bg-warning/10 border-warning/30',
    description: 'A 6-digit registration or verification code for WhatsApp, Telegram, or Signal.',
    actions: [
      {
        step: 1,
        title: 'Re-Verify Your Account Immediately',
        desc: 'Open WhatsApp on your mobile device, enter your phone number, and request a new SMS verification code. Submitting it kicks the scammer off your account.',
      },
      {
        step: 2,
        title: 'Log Out All Linked Devices',
        desc: 'Go to WhatsApp > Settings > Linked Devices. Tap each active web or desktop session and select "Log Out" immediately.',
      },
      {
        step: 3,
        title: 'Enable Two-Step Verification (6-Digit PIN)',
        desc: 'Go to Settings > Account > Two-Step Verification > Turn On. Choose a secret 6-digit PIN. Attackers cannot re-register without this PIN.',
      },
      {
        step: 4,
        title: 'Call Close Contacts to Prevent Impersonation',
        desc: 'Call your family and group contacts via telephone. Warn them that someone may attempt to message them impersonating you to ask for money.',
      },
    ],
  },
  email: {
    id: 'email',
    label: 'Email Account OTP',
    badge: 'Identity Risk',
    badgeColor: 'text-accent bg-accent/10 border-accent/30',
    description: 'A security or reset code for Google, Microsoft, Yahoo, or Apple ID.',
    actions: [
      {
        step: 1,
        title: 'Initiate Official Password Reset Immediately',
        desc: 'Visit accounts.google.com or outlook.live.com directly to change your master password before the attacker changes account recovery details.',
      },
      {
        step: 2,
        title: 'Sign Out of All Other Devices',
        desc: 'In your security settings, review active devices and revoke access for all computers, phones, or tablets you do not recognize.',
      },
      {
        step: 3,
        title: 'Check Forwarding & Auto-Delete Rules',
        desc: 'Scammers frequently configure auto-forwarding rules to secretly receive your future emails. Check Settings > Filters & Forwarding.',
      },
      {
        step: 4,
        title: 'Switch to Authenticator App 2FA',
        desc: 'Switch 2FA from SMS to Google or Microsoft Authenticator so intercepted SMS codes cannot compromise your account in the future.',
      },
    ],
  },
  other: {
    id: 'other',
    label: 'Other Service OTP',
    badge: 'Account Security',
    badgeColor: 'text-primary bg-primary/10 border-primary/30',
    description: 'An OTP for government services, shopping, delivery apps, or social media.',
    actions: [
      {
        step: 1,
        title: 'Log in Directly on the Official App',
        desc: 'Open the genuine application or website (not via links) and update your password immediately.',
      },
      {
        step: 2,
        title: 'Cancel Call & SMS Forwarding (GSM Code)',
        desc: 'If scammers tricked you into dialing an MMI code, dial ##002# on your phone dialer right now to cancel all unconditional call and SMS forwarding.',
      },
      {
        step: 3,
        title: 'Remove Linked Payment Methods',
        desc: 'Remove saved cards and UPI mandates from the affected platform to prevent unauthorized purchases.',
      },
      {
        step: 4,
        title: 'Report Incident to Service Support',
        desc: 'Contact the platform’s official support center to log that an unauthorized party accessed an OTP.',
      },
    ],
  },
};

/**
 * Incident D: Fraud Response Assistant Options
 */
export const PAYMENT_FRAUD_ACTIONS = {
  upi: {
    id: 'upi',
    label: 'UPI Payment',
    sublabel: 'Google Pay, PhonePe, Paytm, BHIM, Cred',
    actions: [
      {
        title: 'Call 1930 Helpline Immediately',
        desc: 'Dial 1930 and provide the operator with the 12-digit UPI Reference ID (UTR) and the beneficiary UPI ID (VPA) to freeze the recipient bank account.',
      },
      {
        title: 'Lodge a Dispute Inside Your UPI App',
        desc: 'In Google Pay / PhonePe / Paytm, go to Transaction History > tap the payment > "Having issues / Dispute" to register an immediate fraud flag.',
      },
      {
        title: 'Preserve UPI Reference / UTR Number',
        desc: 'Copy the 12-digit UTR number and take a clear screenshot of the transaction confirmation page.',
      },
      {
        title: 'Cancel Any Autopay Mandates',
        desc: 'If you were tricked into approving an autopay mandate, go to your UPI app Autopay section and cancel it immediately.',
      },
    ],
  },
  card: {
    id: 'card',
    label: 'Debit / Credit Card',
    sublabel: 'Visa, Mastercard, RuPay, Maestro',
    actions: [
      {
        title: 'Lock / Block Card in Banking App',
        desc: 'Open your mobile banking app immediately and toggle "Lock Card" or turn off online/international transactions to stop further charges.',
      },
      {
        title: 'Call Card Issuer Fraud Desk for Chargeback',
        desc: 'Call the emergency toll-free number on the back of your card. Request an immediate hotlist and initiate a chargeback claim for unauthorized debit.',
      },
      {
        title: 'Save Transaction SMS & Authorization Codes',
        desc: 'Preserve the debit SMS alert showing the merchant name, currency, timestamp, and authorization code.',
      },
      {
        title: 'Submit Dispute within 72 Hours',
        desc: 'Under RBI guidelines, reporting unauthorized card transactions within 3 days ensures maximum liability protection from your bank.',
      },
    ],
  },
  netbanking: {
    id: 'netbanking',
    label: 'Net Banking (IMPS / NEFT / RTGS)',
    sublabel: 'Internet Banking Fund Transfer',
    actions: [
      {
        title: 'Contact Bank Branch & Internet Helpdesk',
        desc: 'Call your bank’s 24/7 internet banking fraud desk immediately to request an IMPS/NEFT recall or freeze the beneficiary account.',
      },
      {
        title: 'Reset Net Banking Credentials',
        desc: 'Change both your Net Banking Login Password and Transaction PIN/Password from a clean, secure device.',
      },
      {
        title: 'Download Account Statement & UTR',
        desc: 'Download the statement showing the debited account number, timestamp, beneficiary IFSC code, and UTR number.',
      },
      {
        title: 'Lodge Official Complaint on 1930 & Portal',
        desc: 'Call 1930 and register your complaint with the UTR number on https://cybercrime.gov.in/.',
      },
    ],
  },
};
