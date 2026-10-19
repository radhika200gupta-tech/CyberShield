/**
 * Safe, Fictional Demonstration Email Samples for Email Forensics Lab
 * Realistic RFC 5322 headers for educational and forensic demonstration.
 */

export const SAMPLE_EMAILS = [
  {
    id: 'spoofed-bank-phish',
    title: 'Urgent Banking Phish (Brand Impersonation & Auth Failures)',
    category: 'High Threat Demonstration',
    description: 'Simulates a credential harvesting attempt targeting Chase Bank with SPF fail, DKIM mismatch, and an untrusted Reply-To drop address.',
    rawContent: `Delivered-To: victim@example-corp.com
Received: by 2002:a05:6e02:18c4:b0:3a1:5c78:9ef0 with SMTP id j4csp1829023nek;
        Mon, 18 Oct 2026 14:32:45 -0700 (PDT)
X-Google-Smtp-Source: AGHT+IFb+y4381048201948210934891230489
X-Received: by 2002:a2e:9208:0:b0:2e0:9820:1082 with SMTP id k8mb891042nef.12.1697664765102;
        Mon, 18 Oct 2026 14:32:44 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1697664764; cv=none;
        d=google.com; s=arc-20160816;
        b=N2u0V2...
Received: from mail.bulletproof-hosting.net (mail.bulletproof-hosting.net. [185.220.101.42])
        by mx.google.com with ESMTPS id o18-20020a2e9208000000b002e098201082si189209nef.12.2026.10.18.14.32.43
        for <victim@example-corp.com>
        (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256);
        Mon, 18 Oct 2026 14:32:44 -0700 (PDT)
Received: from [192.168.1.105] (unknown [194.26.29.112])
        by mail.bulletproof-hosting.net (Postfix) with ESMTP id 4SwZ7Q2dZBz9f8K;
        Mon, 18 Oct 2026 21:32:40 +0000 (UTC)
Authentication-Results: mx.google.com;
       dkim=fail (bad signature) header.i=@chase-secure-update.com header.s=s2026;
       spf=fail (google.com: domain of bounce@bulletproof-hosting.net designates 185.220.101.42 as permitted sender, but header From is unauthorized) smtp.mailfrom=bounce@bulletproof-hosting.net;
       dmarc=fail (p=quarantine sp=quarantine dis=quarantine) header.from=chase-secure-update.com
Received-SPF: fail (google.com: domain of bounce@bulletproof-hosting.net designates 185.220.101.42 as permitted sender) client-ip=185.220.101.42;
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=chase-secure-update.com; s=s2026; t=1697664760;
        h=from:to:subject:date:message-id:reply-to;
        bh=y83Kd92Jf81HdkwL0294Jfnx=;
        b=K2l94Pq...
From: "Chase Online Security" <security-alerts@chase-secure-update.com>
Reply-To: verify-dept@chase-fraud-dept.ru
To: victim@example-corp.com
Subject: URGENT: Unauthorized Wire Attempt Detected - Verify Identity Within 2 Hours
Date: Mon, 18 Oct 2026 21:32:38 +0000
Message-ID: <20261018213238.4SwZ7Q2dZBz9f8K@mail.bulletproof-hosting.net>
Return-Path: <bounce@bulletproof-hosting.net>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit
X-Mailer: PHPMailer 6.1.4 (https://github.com/PHPMailer/PHPMailer)

Dear Chase Customer,

We detected an unauthorized international wire transfer of $4,850.00 from your account at 14:28 EST.

If you did not authorize this transaction, you must immediately confirm your security PIN and account password to cancel this transfer:

http://185.220.101.42/chase/auth/verify-wire.php?id=9482104

Failure to verify within 2 hours will result in permanent ledger execution and account suspension.

Chase Fraud Prevention Operations
1-800-CHASE-ALERT (Unmonitored Automated Line)`
  },
  {
    id: 'clean-github-alert',
    title: 'Legitimate Corporate Notification (GitHub Security - Full Pass)',
    category: 'Authentic Transmission',
    description: 'A genuine security notification from GitHub demonstrating valid cryptographic DKIM alignment, authorized SPF IP range, and passing DMARC policy.',
    rawContent: `Delivered-To: developer@techfirm.io
Received: by 2002:a05:6000:1082:b0:300:1a2b:3c4d with SMTP id h2csp948123abc;
        Tue, 19 Oct 2026 09:14:22 -0700 (PDT)
Received: from out-1.smtp.github.com (out-1.smtp.github.com. [192.30.252.204])
        by mx.google.com with ESMTPS id f12-20020a056000108200b003001a2b3c4dsi482912abc.18.2026.10.19.09.14.21
        for <developer@techfirm.io>
        (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256);
        Tue, 19 Oct 2026 09:14:21 -0700 (PDT)
Authentication-Results: mx.google.com;
       dkim=pass header.i=@github.com header.s=pf2023 header.b=X9e218;
       spf=pass (google.com: domain of noreply@github.com designates 192.30.252.204 as permitted sender) smtp.mailfrom=noreply@github.com;
       dmarc=pass (p=reject sp=reject dis=none) header.from=github.com
Received-SPF: pass (google.com: domain of noreply@github.com designates 192.30.252.204 as permitted sender) client-ip=192.30.252.204;
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=github.com;
        s=pf2023; t=1697732060;
        h=from:to:subject:date:message-id:reply-to:list-id:list-unsubscribe;
        bh=5Pq2k8Hfd92Kf74Lp92Mxq=;
        b=X9e218...
From: "GitHub" <noreply@github.com>
Reply-To: "GitHub Support" <support@github.com>
To: developer@techfirm.io
Subject: [GitHub] Security Advisory: New OAuth application authorized
Date: Tue, 19 Oct 2026 16:14:18 +0000
Message-ID: <github/security-advisory/849201948@github.com>
Return-Path: <noreply@github.com>
List-Id: <security.github.com>
List-Unsubscribe: <https://github.com/settings/notifications>
Content-Type: text/plain; charset="UTF-8"

Hi @dev-lead,

A new OAuth application ("CyberShield CI Scanner") was authorized to access your GitHub account.

Review application permissions:
https://github.com/settings/applications

If you authorized this application, no further action is necessary.
If you did not authorize this, revoke access immediately in your account settings.`
  },
  {
    id: 'nuanced-third-party-relay',
    title: 'Third-Party SaaS Relay (Zendesk Ticketing - Legitimate Mismatch)',
    category: 'Nuanced Enterprise Forensics',
    description: 'Demonstrates an enterprise customer support relay where Return-Path points to Zendesk infrastructure, yet SPF delegation and DKIM alignment confirm legitimacy.',
    rawContent: `Delivered-To: customer@enterprise-client.com
Received: by 2002:a17:90a:5c8e:b0:280:9810:1234 with SMTP id p14csp819203ghj;
        Wed, 20 Oct 2026 11:05:12 -0400 (EDT)
Received: from mail4.zendesk.com (mail4.zendesk.com. [192.161.148.120])
        by mx.microsoft-protection.com with ESMTPS id 8492018402
        for <customer@enterprise-client.com>;
        Wed, 20 Oct 2026 11:05:10 -0400 (EDT)
Authentication-Results: mx.microsoft-protection.com;
       dkim=pass (signature verified) header.i=@acme-software.com header.s=zendesk1;
       spf=pass (microsoft-protection.com: domain of mail4.zendesk.com designates 192.161.148.120 as permitted sender) smtp.mailfrom=support@mail4.zendesk.com;
       dmarc=pass (p=none sp=none) header.from=acme-software.com
Received-SPF: pass (microsoft-protection.com: domain of mail4.zendesk.com designates 192.161.148.120 as permitted sender) client-ip=192.161.148.120;
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=acme-software.com;
        s=zendesk1; t=1697814308;
        h=from:to:subject:date:message-id:reply-to;
        bh=Ab9K2jF81Ld018Kfx92=;
        b=M8a92B...
From: "Acme Support Team" <support@acme-software.com>
Reply-To: "Acme Support" <support+ticket84920@acme-software.zendesk.com>
To: customer@enterprise-client.com
Subject: [Request #84920] Update on Enterprise License Renewal
Date: Wed, 20 Oct 2026 15:05:08 +0000
Message-ID: <zendesk.ticket84920.8192048@acme-software.zendesk.com>
Return-Path: <support@mail4.zendesk.com>
X-Zendesk-Customer-Instance: acme-software
Content-Type: text/plain; charset="UTF-8"

Hello,

Thank you for contacting Acme Support. Your enterprise subscription renewal has been processed.

Ticket Reference: #84920
Assigned Engineer: Sarah Jensen

You can view the full ticket transcript or add comments at:
https://acme-software.zendesk.com/tickets/84920

Best regards,
Acme Cloud Technical Support`
  }
];

export const SAMPLE_EMAIL_SCENARIOS = SAMPLE_EMAILS;

