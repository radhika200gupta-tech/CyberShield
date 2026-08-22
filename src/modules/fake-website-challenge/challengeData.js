// challengeData.js
// Plain JavaScript array of challenges.
// Each challenge has two websites (A and B), the correct answer ('A' or 'B'), and a short explanation.

export const challenges = [
  {
    id: 1,
    websiteA: {
      url: "https://www.amazon.com/your-account",
      content: {
        companyName: "Amazon",
        badge: "Shopping & Orders",
        title: "Sign in to your account",
        subtitle: "Enter your email or mobile phone number to continue.",
        buttonText: "Continue",
        notice: "Protected by Amazon 2-Step Verification and secure TLS encryption."
      }
    },
    websiteB: {
      url: "http://amaz0n-security-update.xyz/login",
      content: {
        companyName: "Amazon",
        badge: "Account Alert",
        title: "Urgent: Account Suspension",
        subtitle: "Your account will be terminated in 24 hours unless you verify right now.",
        buttonText: "Verify Identity Now",
        notice: "Enter your credit card number and password immediately to avoid closure."
      }
    },
    correctAnswer: "B",
    explanation: "amaz0n-security-update.xyz uses a zero '0' instead of 'o', lacks HTTPS encryption, and uses fake urgency to steal credentials."
  },
  {
    id: 2,
    websiteA: {
      url: "https://secure-paypal-verification.net/signin",
      content: {
        companyName: "PayPal",
        badge: "Security Alert",
        title: "Suspicious Login Detected",
        subtitle: "We noticed an unrecognized payment from Russia. Confirm your account details.",
        buttonText: "Confirm Bank Account",
        notice: "Please provide your full Social Security Number and debit card PIN to unlock funds."
      }
    },
    websiteB: {
      url: "https://www.paypal.com/signin",
      content: {
        companyName: "PayPal",
        badge: "Digital Wallet",
        title: "Log in to your PayPal account",
        subtitle: "Pay online or transfer money safely with PayPal Buyer Protection.",
        buttonText: "Next",
        notice: "Official PayPal authentication with end-to-end encrypted financial security."
      }
    },
    correctAnswer: "A",
    explanation: "secure-paypal-verification.net is an imitation domain designed to steal banking details, whereas paypal.com is the real domain."
  },
  {
    id: 3,
    websiteA: {
      url: "https://login.microsoftonline.com",
      content: {
        companyName: "Microsoft",
        badge: "Work or School",
        title: "Sign in to Microsoft 365",
        subtitle: "Access Outlook, Teams, SharePoint, and corporate OneDrive files.",
        buttonText: "Next",
        notice: "Official enterprise Single Sign-On (SSO) backed by Microsoft Entra ID."
      }
    },
    websiteB: {
      url: "https://login.microsoftonline.com.account-verify.online",
      content: {
        companyName: "Microsoft",
        badge: "IT Helpdesk",
        title: "Email Password Expiration",
        subtitle: "Your company password expired today. Re-enter your password to avoid mailbox deletion.",
        buttonText: "Renew Password",
        notice: "Immediate action required by your corporate IT administrator."
      }
    },
    correctAnswer: "B",
    explanation: "The actual domain here is account-verify.online (a subdomain trick), not microsoftonline.com."
  },
  {
    id: 4,
    websiteA: {
      url: "http://g00gle-security-alert.info/recovery",
      content: {
        companyName: "Google",
        badge: "Critical Alert",
        title: "Password Compromised!",
        subtitle: "A hacker accessed your Gmail. Click below to verify your password immediately.",
        buttonText: "Verify Google Account",
        notice: "Unencrypted connection asking for your master Google account password."
      }
    },
    websiteB: {
      url: "https://accounts.google.com/signin",
      content: {
        companyName: "Google",
        badge: "Google Account",
        title: "Sign in with Google",
        subtitle: "Use your Google Account for Gmail, YouTube, Google Drive, and Google Maps.",
        buttonText: "Next",
        notice: "Secure login with Google Passkeys, 2-Step Verification, and passkey protection."
      }
    },
    correctAnswer: "A",
    explanation: "g00gle-security-alert.info uses zeroes '00' instead of 'oo', lacks HTTPS, and uses fear tactics to harvest passwords."
  },
  {
    id: 5,
    websiteA: {
      url: "https://www.netflix.com/youraccount",
      content: {
        companyName: "Netflix",
        badge: "Streaming Account",
        title: "Account & Membership",
        subtitle: "Manage your streaming plan, payment methods, and user profiles.",
        buttonText: "Manage Account",
        notice: "Official Netflix member dashboard and subscription preferences."
      }
    },
    websiteB: {
      url: "https://netflix-billing-update-service.cc/payment",
      content: {
        companyName: "Netflix",
        badge: "Billing Issue",
        title: "Payment Method Failed",
        subtitle: "Your subscription was paused. Re-enter your card number to continue watching.",
        buttonText: "Update Payment Method",
        notice: "Demands immediate entry of credit card number, expiration date, and CVV code."
      }
    },
    correctAnswer: "B",
    explanation: "netflix-billing-update-service.cc uses a deceptive .cc domain and fake payment failure prompt to capture credit card info."
  }
];
