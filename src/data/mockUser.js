export const mockUser = {
  id: 'usr_8271',
  name: 'User',
  email: 'user@example.com',
  avatarInitials: 'AM',
  role: 'Security Analyst',
  plan: 'Pro',
  joinedAt: '2025-02-14',
  securityScore: 82,
  stats: {
    scansRun: 316,
    threatsBlocked: 47,
    achievementsUnlocked: 9,
  },
  achievements: [
    { id: 1, title: 'First Scan', description: 'Ran your first security scan', unlocked: true },
    { id: 2, title: 'Threat Hunter', description: 'Detected 25+ threats', unlocked: true },
    { id: 3, title: 'Password Pro', description: 'Analyzed 50+ passwords', unlocked: true },
    { id: 4, title: 'Streak Keeper', description: '30-day scan streak', unlocked: false },
    { id: 5, title: 'Phishing Slayer', description: 'Caught 10 phishing emails', unlocked: true },
    { id: 6, title: 'Perfect Score', description: 'Reached a 100 security score', unlocked: false },
  ],
};
