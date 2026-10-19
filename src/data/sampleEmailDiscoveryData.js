/**
 * Safe Demonstration Scenarios for Email Account Discovery & Exposure Intelligence
 * 
 * Provides illustrative training data designed to demonstrate:
 * - Real vs. Inconclusive vs. Unavailable status indicators
 * - Public cryptographic and avatar registries
 * - Corporate vs. Disposable vs. Subaddressed domain classifications
 * - Controlled exposure reporting without exposing passwords or breach dumps
 */

export const SAMPLE_DISCOVERY_SCENARIOS = [
  {
    id: 'developer-public-footprint',
    title: 'Public Developer Footprint',
    badge: 'CONFIRMED PUBLIC SIGNALS',
    email: 'sarah.engineer@cloudforge.io',
    description: 'Demonstrates verified public profile signals across Gravatar and OpenPGP keyservers with simulated breach monitoring data.',
    isSample: true,
    emailIntelligence: {
      email: 'sarah.engineer@cloudforge.io',
      localPart: 'sarah.engineer',
      domain: 'cloudforge.io',
      hasSubaddress: false,
      baseLocalPart: 'sarah.engineer',
      subaddressTag: null,
      baseEmail: 'sarah.engineer@cloudforge.io',
      tld: '.io',
      isPunycode: false,
      length: 27,
      localPartLength: 14
    },
    domainInfo: {
      domain: 'cloudforge.io',
      isDisposable: false,
      providerType: 'google',
      providerName: 'Google Workspace Enterprise',
      mxDescription: 'Custom domain routed through Google Workspace MX (aspmx.l.google.com)'
    },
    services: [
      {
        id: 'gravatar',
        name: 'Gravatar / WordPress.com',
        category: 'Identity & Avatars',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Public avatar image and profile record verified for hash 4f8a...9c2e',
        timestamp: 'Verified Live',
        profileUrl: 'https://gravatar.com',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        explanation: 'Gravatar enables universal avatars by computing an MD5 hash of user emails. An HTTP 200 avatar response confirms an active account registered under this exact address.',
        limitations: 'Confirming a Gravatar avatar confirms registration, but profile metadata (name, bio) may be user-configured or pseudonymous.'
      },
      {
        id: 'openpgp',
        name: 'OpenPGP Public Key Registry',
        category: 'Cryptographic Registries',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Active RSA-4096 public encryption key verified on keys.openpgp.org (Fingerprint: 8F3D...B421)',
        timestamp: 'Synced 2026-04-12',
        profileUrl: 'https://keys.openpgp.org/search?q=sarah.engineer%40cloudforge.io',
        explanation: 'The keys.openpgp.org registry requires email confirmation before associating a cryptographic key with an email address. This provides cryptographically verified evidence.',
        limitations: 'Confirms that the email holder verified this PGP key with the registry, but does not indicate recent account usage.'
      },
      {
        id: 'github',
        name: 'GitHub Developer Platform',
        category: 'Developer Platforms',
        status: 'POSSIBLE_MATCH',
        sourceType: 'demo',
        evidence: 'Public GitHub profile @sarah-engineer found matching email in public metadata',
        timestamp: 'Historical Commit',
        profileUrl: 'https://github.com',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        explanation: 'Git commits frequently record public committer email addresses in metadata. Found in public repository commit logs.',
        limitations: 'Git committer emails can be configured arbitrarily in local .gitconfig without authentication. Possible match only; does not prove a registered GitHub user account.'
      },
      {
        id: 'email-structure',
        name: 'Email Syntax & Domain Federation',
        category: 'Structure & Federation',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Canonical enterprise syntax on custom domain cloudforge.io (Google Workspace MX)',
        timestamp: 'Active DNS',
        profileUrl: 'https://whois.domaintools.com/cloudforge.io',
        explanation: 'Standard corporate email formatting without subaddressing tags. Domain federates to Google enterprise cloud.',
        limitations: 'Valid domain MX confirms organizational email infrastructure, but does not guarantee the specific user mailbox exists.'
      },
      {
        id: 'google',
        name: 'Google / Gmail Ecosystem',
        category: 'Consumer & Workspace',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Domain cloudforge.io DNS MX records delegate mail processing to Google Workspace',
        timestamp: 'Active DNS Record',
        profileUrl: 'https://workspace.google.com',
        explanation: 'Domain MX evaluation confirms active organization tenant configuration on Google cloud infrastructure.',
        limitations: 'Proves the organization domain uses Google Workspace, but individual mailbox status is not publicly queryable without admin directory API tokens.'
      },
      {
        id: 'microsoft',
        name: 'Microsoft 365 / Entra ID',
        category: 'Enterprise Productivity',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No Microsoft tenant or Azure AD federation records associated with cloudforge.io',
        timestamp: 'Current Verification',
        profileUrl: 'https://www.microsoft.com/microsoft-365',
        explanation: 'Domain lookup reveals no active Microsoft 365 tenant or federated namespace authority.',
        limitations: 'Confirms domain is not an M365 tenant. Individual personal Microsoft accounts created with this address could theoretically exist in consumer space.'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn Professional Network',
        category: 'Professional Networks',
        status: 'UNAVAILABLE',
        sourceType: 'unavailable',
        evidence: 'Direct enumeration restricted by platform rate limits & privacy controls',
        timestamp: 'Restricted',
        profileUrl: 'https://www.linkedin.com',
        explanation: 'LinkedIn restricts unauthenticated account existence queries behind security barriers and anti-scraping controls.',
        limitations: 'CyberShield adheres to ethical guidelines and does not bypass platform authentication barriers or engage in credential testing.'
      },
      {
        id: 'spotify',
        name: 'Spotify Media',
        category: 'Entertainment & Media',
        status: 'UNAVAILABLE',
        sourceType: 'unavailable',
        evidence: 'Direct enumeration restricted by platform authentication defense',
        timestamp: 'Restricted',
        profileUrl: 'https://www.spotify.com',
        explanation: 'Commercial streaming services enforce rate-limiting and CAPTCHA defenses to prevent enumeration attacks.',
        limitations: 'Account status cannot be reliably determined via passive OSINT without active authentication interaction.'
      }
    ],
    publicProfiles: [
      {
        source: 'Gravatar Public Registry',
        displayName: 'Sarah J. (Cloud Engineer)',
        username: 'sarah_cloudforge',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        verified: true,
        type: 'Public Avatar & Profile',
        details: 'Registered Gravatar profile linked to WordPress.com ecosystem.',
        url: 'https://gravatar.com'
      },
      {
        source: 'OpenPGP Key Directory',
        displayName: 'Sarah Jenkins <sarah.engineer@cloudforge.io>',
        keyId: '0x8F3D1C4A2B99E421',
        algorithm: 'RSA-4096 (Valid through 2028)',
        verified: true,
        type: 'Public Cryptographic Key',
        details: 'Email ownership verified via cryptographic challenge by keys.openpgp.org.',
        url: 'https://keys.openpgp.org'
      },
      {
        source: 'GitHub Developer Platform',
        displayName: '@sarah-engineer (Public Developer)',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        verified: false,
        type: 'Developer Profile Reference',
        details: 'Public committer record matching sarah.engineer@cloudforge.io.',
        url: 'https://github.com'
      }
    ],
    exposure: {
      status: 'EXPOSURES_DETECTED',
      provider: 'CyberShield Simulated Exposure Monitor (Demo Feed)',
      lastCheck: '2026-10-18',
      summary: '1 historical public breach incident associated with this email address in third-party databases.',
      records: [
        {
          breachName: 'Engineering SaaS Platform Incident',
          domain: 'developer-hub-example.com',
          breachDate: 'October 2021',
          dataClasses: ['Email Addresses', 'Usernames', 'Hashed Passwords', 'API Access Keys (Revoked)'],
          description: 'A third-party developer collaboration platform suffered an unauthorized database export in 2021. Salted password hashes were leaked.',
          remediation: 'Ensure passwords used on this service have been rotated. CyberShield never stores or displays leaked passwords.'
        }
      ]
    }
  },

  {
    id: 'corporate-enterprise-cfo',
    title: 'Enterprise Corporate Executive',
    badge: 'TENANT DETECTED • NO PUBLIC PROFILES',
    email: 'cfo@cybercorp-global.com',
    description: 'Demonstrates a high-security corporate mailbox hosted on Microsoft 365 with strict privacy controls and no public consumer footprint.',
    isSample: true,
    emailIntelligence: {
      email: 'cfo@cybercorp-global.com',
      localPart: 'cfo',
      domain: 'cybercorp-global.com',
      hasSubaddress: false,
      baseLocalPart: 'cfo',
      subaddressTag: null,
      baseEmail: 'cfo@cybercorp-global.com',
      tld: '.com',
      isPunycode: false,
      length: 24,
      localPartLength: 3
    },
    domainInfo: {
      domain: 'cybercorp-global.com',
      isDisposable: false,
      providerType: 'microsoft',
      providerName: 'Microsoft 365 / Entra ID Enterprise',
      mxDescription: 'Custom domain routed through Microsoft Protection (cybercorp-global-com.mail.protection.outlook.com)'
    },
    services: [
      {
        id: 'microsoft',
        name: 'Microsoft 365 / Entra ID',
        category: 'Enterprise Productivity',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Domain cybercorp-global.com verified as active Microsoft 365 Exchange Online tenant',
        timestamp: 'Active DNS Record',
        profileUrl: 'https://www.microsoft.com/microsoft-365',
        explanation: 'Domain MX and SPF records confirm legitimate enterprise Microsoft 365 deployment.',
        limitations: 'Proves domain tenant configuration. Individual mailbox existence within the tenant requires internal corporate directory access.'
      },
      {
        id: 'email-structure',
        name: 'Email Syntax & Domain Federation',
        category: 'Structure & Federation',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'High-reputation corporate domain; Microsoft Exchange Online MX routing',
        timestamp: 'Active DNS',
        profileUrl: 'https://whois.domaintools.com/cybercorp-global.com',
        explanation: 'Executive role mailbox on custom enterprise domain with strict SPF/DKIM policies.',
        limitations: 'Enterprise access controls prevent external unauthenticated verification of internal aliases.'
      },
      {
        id: 'gravatar',
        name: 'Gravatar / WordPress.com',
        category: 'Identity & Avatars',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No Gravatar avatar registered for computed email hash',
        timestamp: 'Verified Live',
        profileUrl: 'https://gravatar.com',
        explanation: 'No public Gravatar profile exists. Common for corporate personnel who do not participate in blogging or open CMS platforms.',
        limitations: 'Absence of Gravatar does not imply the email is invalid; it simply indicates no registration with Automattic services.'
      },
      {
        id: 'openpgp',
        name: 'OpenPGP Public Key Registry',
        category: 'Cryptographic Registries',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No public keys matching this address found on keys.openpgp.org',
        timestamp: 'Current Verification',
        profileUrl: 'https://keys.openpgp.org/search?q=cfo%40cybercorp-global.com',
        explanation: 'The individual has not published an OpenPGP public key to standard public registries.',
        limitations: 'Enterprise organizations often use internal S/MIME certificates rather than public PGP keyservers.'
      },
      {
        id: 'github',
        name: 'GitHub Developer Platform',
        category: 'Developer Platforms',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No public commits or repositories associated with this corporate address',
        timestamp: 'Current Verification',
        profileUrl: 'https://github.com',
        explanation: 'Expected for financial and executive roles without software engineering activities.',
        limitations: 'User may have a personal GitHub account registered under a private personal address.'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn Professional Network',
        category: 'Professional Networks',
        status: 'UNAVAILABLE',
        sourceType: 'unavailable',
        evidence: 'Direct enumeration restricted by platform rate limits & privacy controls',
        timestamp: 'Restricted',
        profileUrl: 'https://www.linkedin.com',
        explanation: 'Public email enumeration is strictly blocked by LinkedIn security architecture.',
        limitations: 'Direct confirmation requires authenticated platform search or email invitation.'
      }
    ],
    publicProfiles: [],
    exposure: {
      status: 'UNAVAILABLE',
      provider: 'No Provider Configured',
      lastCheck: null,
      summary: 'Exposure checks unavailable — no provider configured.',
      notice: 'An authorized breach-monitoring provider (such as Have I Been Pwned API v3) is required for live exposure checks. CyberShield adheres to strict privacy ethics and does not query third-party breach dumps without verified authorized credentials.',
      hibpSpec: {
        endpoint: 'GET https://haveibeenpwned.com/api/v3/breachedaccount/{account}?truncateResponse=false',
        header: 'hibp-api-key: <32-character-api-key>',
        rateLimit: '600 to 100,000 requests/minute',
        architectureNote: 'Requires Phase 3 backend proxy.'
      },
      records: []
    }
  },

  {
    id: 'disposable-burner-email',
    title: 'Disposable / Burner Email Domain',
    badge: 'HIGH RISK DISPOSABLE DOMAIN',
    email: 'anon89410@mailinator.com',
    description: 'Demonstrates detection of temporary, anonymous inbox services frequently used in phishing campaigns, test automation, and spam evasion.',
    isSample: true,
    emailIntelligence: {
      email: 'anon89410@mailinator.com',
      localPart: 'anon89410',
      domain: 'mailinator.com',
      hasSubaddress: false,
      baseLocalPart: 'anon89410',
      subaddressTag: null,
      baseEmail: 'anon89410@mailinator.com',
      tld: '.com',
      isPunycode: false,
      length: 23,
      localPartLength: 9
    },
    domainInfo: {
      domain: 'mailinator.com',
      isDisposable: true,
      providerType: 'disposable',
      providerName: 'Mailinator Public Inboxes',
      mxDescription: 'Known disposable temporary inbox provider (mail.mailinator.com)'
    },
    services: [
      {
        id: 'email-structure',
        name: 'Email Syntax & Domain Federation',
        category: 'Structure & Federation',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Domain mailinator.com matches known temporary burner email blocklist',
        timestamp: 'Local Analysis',
        profileUrl: 'https://whois.domaintools.com/mailinator.com',
        explanation: 'Disposable burner service detected. Messages sent to this domain are publicly accessible without authentication.',
        limitations: 'High risk indicator in threat telemetry. Often used for spam evasion and malicious testing.'
      },
      {
        id: 'gravatar',
        name: 'Gravatar / WordPress.com',
        category: 'Identity & Avatars',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No Gravatar profile associated with this burner address',
        timestamp: 'Verified Live',
        profileUrl: 'https://gravatar.com',
        explanation: 'Disposable emails are rarely registered with long-term identity services.',
        limitations: 'None.'
      },
      {
        id: 'openpgp',
        name: 'OpenPGP Public Key Registry',
        category: 'Cryptographic Registries',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No cryptographic key registered',
        timestamp: 'Current Verification',
        profileUrl: 'https://keys.openpgp.org/search?q=anon89410%40mailinator.com',
        explanation: 'Disposable accounts do not establish long-term cryptographic identities.',
        limitations: 'None.'
      },
      {
        id: 'github',
        name: 'GitHub Developer Platform',
        category: 'Developer Platforms',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No public GitHub activity',
        timestamp: 'Current Verification',
        profileUrl: 'https://github.com',
        explanation: 'GitHub restricts registration from known disposable mail domains.',
        limitations: 'None.'
      },
      {
        id: 'google',
        name: 'Google / Gmail Ecosystem',
        category: 'Consumer & Workspace',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'Domain is a known throwaway inbox provider, not a Google tenant',
        timestamp: 'Current Verification',
        profileUrl: 'https://workspace.google.com',
        explanation: 'Mailinator is a free, public, unauthenticated inbox pool.',
        limitations: 'None.'
      }
    ],
    publicProfiles: [],
    exposure: {
      status: 'CLEAN',
      provider: 'CyberShield Simulated Exposure Monitor (Demo Feed)',
      lastCheck: '2026-10-18',
      summary: 'No exposure records cataloged for this temporary address.',
      records: []
    }
  },

  {
    id: 'personal-clean-email',
    title: 'Clean Personal Email Address',
    badge: 'CONSUMER MAILBOX • MINIMAL FOOTPRINT',
    email: 'alex.morgan92@gmail.com',
    description: 'Demonstrates a standard consumer mailbox on Google Mail with a minimal public footprint and privacy-conscious settings.',
    isSample: true,
    emailIntelligence: {
      email: 'alex.morgan92@gmail.com',
      localPart: 'alex.morgan92',
      domain: 'gmail.com',
      hasSubaddress: false,
      baseLocalPart: 'alex.morgan92',
      subaddressTag: null,
      baseEmail: 'alex.morgan92@gmail.com',
      tld: '.com',
      isPunycode: false,
      length: 22,
      localPartLength: 13
    },
    domainInfo: {
      domain: 'gmail.com',
      isDisposable: false,
      providerType: 'google',
      providerName: 'Google Gmail Consumer',
      mxDescription: 'Google Consumer MX cluster (gmail-smtp-in.l.google.com)'
    },
    services: [
      {
        id: 'google',
        name: 'Google / Gmail Ecosystem',
        category: 'Consumer & Workspace',
        status: 'POSSIBLE_MATCH',
        sourceType: 'demo',
        evidence: 'Valid format within @gmail.com namespace; routed to Google consumer MX',
        timestamp: 'Current Verification',
        profileUrl: 'https://workspace.google.com',
        explanation: 'Standard Gmail address syntax. Google does not publish an unauthenticated directory of individual consumer inboxes.',
        limitations: 'Namespace validity does not confirm whether this specific username is active, deleted, or reserved.'
      },
      {
        id: 'email-structure',
        name: 'Email Syntax & Domain Federation',
        category: 'Structure & Federation',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Standard consumer Gmail address; no subaddressing tag attached',
        timestamp: 'Local Analysis',
        profileUrl: 'https://whois.domaintools.com/gmail.com',
        explanation: 'Valid RFC 5322 syntax. Routes to Google consumer mail processing cluster.',
        limitations: 'Direct delivery depends on recipient mailbox quotas and spam filtering.'
      },
      {
        id: 'gravatar',
        name: 'Gravatar / WordPress.com',
        category: 'Identity & Avatars',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No Gravatar avatar registered for computed email hash',
        timestamp: 'Verified Live',
        profileUrl: 'https://gravatar.com',
        explanation: 'User has not created a Gravatar profile or associated an avatar with this address.',
        limitations: 'Many regular Gmail users do not utilize Gravatar.'
      },
      {
        id: 'openpgp',
        name: 'OpenPGP Public Key Registry',
        category: 'Cryptographic Registries',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No PGP key published to keys.openpgp.org',
        timestamp: 'Current Verification',
        profileUrl: 'https://keys.openpgp.org/search?q=alex.morgan92%40gmail.com',
        explanation: 'No public encryption keys found in keys.openpgp.org directory.',
        limitations: 'Normal for general consumer email addresses.'
      },
      {
        id: 'github',
        name: 'GitHub Developer Platform',
        category: 'Developer Platforms',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No public GitHub commit records found for this address',
        timestamp: 'Current Verification',
        profileUrl: 'https://github.com',
        explanation: 'No open-source contributions detected under this email.',
        limitations: 'User may not be a developer or may use a GitHub no-reply private email.'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn Professional Network',
        category: 'Professional Networks',
        status: 'UNAVAILABLE',
        sourceType: 'unavailable',
        evidence: 'Direct enumeration restricted by platform rate limits & privacy controls',
        timestamp: 'Restricted',
        profileUrl: 'https://www.linkedin.com',
        explanation: 'Direct enumeration is blocked by LinkedIn.',
        limitations: 'Privacy protections prevent unauthenticated discovery.'
      }
    ],
    publicProfiles: [],
    exposure: {
      status: 'CLEAN',
      provider: 'CyberShield Simulated Exposure Monitor (Demo Feed)',
      lastCheck: '2026-10-18',
      summary: 'No breaches reported for this address in public monitoring feeds.',
      records: []
    }
  },

  {
    id: 'tagged-subaddress-alias',
    title: 'Subaddressed Email Alias',
    badge: 'PLUS-TAGGED ALIAS • RFC 5233',
    email: 'alex.morgan92+security@gmail.com',
    description: 'Demonstrates detection of subaddressing (plus-tagging) used to track signups, route newsletters, or identify potential breach leaks.',
    isSample: true,
    emailIntelligence: {
      email: 'alex.morgan92+security@gmail.com',
      localPart: 'alex.morgan92+security',
      domain: 'gmail.com',
      hasSubaddress: true,
      baseLocalPart: 'alex.morgan92',
      subaddressTag: 'security',
      baseEmail: 'alex.morgan92@gmail.com',
      tld: '.com',
      isPunycode: false,
      length: 31,
      localPartLength: 21
    },
    domainInfo: {
      domain: 'gmail.com',
      isDisposable: false,
      providerType: 'google',
      providerName: 'Google Gmail Consumer',
      mxDescription: 'Google Consumer MX cluster (gmail-smtp-in.l.google.com)'
    },
    services: [
      {
        id: 'email-structure',
        name: 'Email Syntax & Domain Federation',
        category: 'Structure & Federation',
        status: 'CONFIRMED',
        sourceType: 'demo',
        evidence: 'Subaddressing detected: tag "+security", base mailbox "alex.morgan92@gmail.com"',
        timestamp: 'Local Analysis',
        profileUrl: 'https://whois.domaintools.com/gmail.com',
        explanation: 'Uses RFC 5233 subaddressing (+security). Mail delivers directly to the root inbox alex.morgan92@gmail.com.',
        limitations: 'Breach databases and services may index either the full tagged string or normalize it to the base address.'
      },
      {
        id: 'google',
        name: 'Google / Gmail Ecosystem',
        category: 'Consumer & Workspace',
        status: 'POSSIBLE_MATCH',
        sourceType: 'demo',
        evidence: 'Root mailbox alex.morgan92 in @gmail.com namespace; routed to Google consumer MX',
        timestamp: 'Current Verification',
        profileUrl: 'https://workspace.google.com',
        explanation: 'Google natively supports plus-addressing for Gmail consumer accounts.',
        limitations: 'Does not indicate if the recipient has configured specific inbox filter rules for +security.'
      },
      {
        id: 'gravatar',
        name: 'Gravatar / WordPress.com',
        category: 'Identity & Avatars',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'MD5 hash of tagged string does not match any registered avatar',
        timestamp: 'Verified Live',
        profileUrl: 'https://gravatar.com',
        explanation: 'Gravatar hashes the full input string. Subaddressed aliases rarely have direct Gravatar mappings.',
        limitations: 'Investigator should check the base address alex.morgan92@gmail.com separately.'
      },
      {
        id: 'openpgp',
        name: 'OpenPGP Public Key Registry',
        category: 'Cryptographic Registries',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No public keys matching tagged alias on keys.openpgp.org',
        timestamp: 'Current Verification',
        profileUrl: 'https://keys.openpgp.org',
        explanation: 'PGP keys are typically published for the canonical root email rather than disposable aliases.',
        limitations: 'None.'
      },
      {
        id: 'github',
        name: 'GitHub Developer Platform',
        category: 'Developer Platforms',
        status: 'NO_MATCH',
        sourceType: 'demo',
        evidence: 'No public GitHub profiles match tagged alias',
        timestamp: 'Current Verification',
        profileUrl: 'https://github.com',
        explanation: 'Developers generally configure their canonical primary address or a private noreply email.',
        limitations: 'None.'
      }
    ],
    publicProfiles: [],
    exposure: {
      status: 'CLEAN',
      provider: 'CyberShield Simulated Exposure Monitor (Demo Feed)',
      lastCheck: '2026-10-18',
      summary: 'No exposure records cataloged for this tagged alias.',
      records: []
    }
  }
];
