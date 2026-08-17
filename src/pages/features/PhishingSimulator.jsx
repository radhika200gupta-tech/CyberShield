import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  FiCheckCircle, FiAlertCircle, FiArrowRight, FiShield, FiMail, 
  FiEye, FiUser, FiLink, FiAlignLeft, FiX, FiActivity, FiTarget, 
  FiTrendingUp, FiAward, FiSave
} from 'react-icons/fi';

const SCENARIOS = [
  {
    id: 1,
    senderName: "Security Alert",
    senderEmail: "security@account-verify.test",
    subject: "Urgent: Verify Your Account Immediately",
    timestamp: "Today, 09:14 AM",
    difficulty: "Beginner",
    message: "Dear user,\n\nWe detected suspicious activity on your account. Your access will be permanently suspended in 2 hours unless you verify your identity.\n\nPlease click the link below to verify your account:\nhttp://verify.account-update.test/login\n\nThank you,\nSecurity Team",
    warningSigns: [
      { id: 'sender', label: "Suspicious sender domain", severity: "High", explanation: "The email comes from 'account-verify.test' rather than an official corporate domain." },
      { id: 'urgency', label: "Extreme urgency", severity: "High", explanation: "Threatening permanent suspension within 2 hours is a classic scare tactic." },
      { id: 'link', label: "Suspicious link", severity: "High", explanation: "The link points to an unofficial URL instead of the actual service." }
    ],
    correctAnswer: "Report as suspicious",
    explanation: "This is a classic credential harvesting phishing attempt using urgency and a fake domain.",
    recommendedAction: "Report the email using your organization's phishing button, then delete it.",
    inspections: {
      sender: "Sender domain 'account-verify.test' does not match any known official service.",
      link: "Link destination 'verify.account-update.test' is unofficial and highly suspicious.",
      message: "Message creates artificial urgency ('suspended in 2 hours') and uses a generic greeting ('Dear user')."
    }
  },
  {
    id: 2,
    senderName: "Billing Department",
    senderEmail: "billing@finance-dept.invalid",
    subject: "Payment Failed - Action Required",
    timestamp: "Yesterday, 02:45 PM",
    difficulty: "Intermediate",
    message: "Hello,\n\nYour recent payment of $199.99 for your subscription has failed. To avoid service interruption, please update your payment method within 24 hours.\n\nUpdate Payment: https://billing.finance-dept.invalid/update\n\nBest regards,\nBilling Support",
    warningSigns: [
      { id: 'sender', label: "Suspicious sender domain", severity: "High", explanation: "The email comes from an '.invalid' domain instead of the actual company." },
      { id: 'financial', label: "Financial pressure", severity: "Medium", explanation: "Requesting immediate payment method updates." },
      { id: 'link', label: "Suspicious link", severity: "High", explanation: "The link goes to an unofficial payment portal." }
    ],
    correctAnswer: "Report as suspicious",
    explanation: "This is a financial phishing attempt designed to steal credit card details.",
    recommendedAction: "Do not click the link. If you suspect a payment issue, log in to the service directly via your browser.",
    inspections: {
      sender: "Sender domain 'finance-dept.invalid' is not the official billing domain.",
      link: "Link destination 'billing.finance-dept.invalid/update' is unofficial.",
      message: "Message demands immediate update of financial details under threat of service interruption."
    }
  },
  {
    id: 3,
    senderName: "IT Helpdesk",
    senderEmail: "it-support@it-desk.test",
    subject: "Mandatory Password Reset",
    timestamp: "Today, 11:30 AM",
    difficulty: "Intermediate",
    message: "Hi team,\n\nA security breach was detected on our network. To secure your account, please reply directly to this email with your current username and password.\n\nIT Support Team",
    warningSigns: [
      { id: 'request', label: "Credential request via email", severity: "High", explanation: "Legitimate IT departments will NEVER ask you to reply with your password." },
      { id: 'sender', label: "Suspicious sender domain", severity: "High", explanation: "The email comes from an unofficial 'it-desk.test' domain." }
    ],
    correctAnswer: "Report as suspicious",
    explanation: "This is a direct credential harvesting attempt via email reply.",
    recommendedAction: "Report this immediately to your actual IT department. Never share passwords via email.",
    inspections: {
      sender: "Sender domain 'it-desk.test' is unofficial.",
      link: "There is no link, but replying directly is requested.",
      message: "The message explicitly asks you to reply with your username and password, which violates all security policies."
    }
  },
  {
    id: 4,
    senderName: "HR Department",
    senderEmail: "hr@company.test",
    subject: "Upcoming Office Closure",
    timestamp: "Today, 04:00 PM",
    difficulty: "Advanced",
    message: "Hi everyone,\n\nJust a reminder that the office will be closed this Friday for the upcoming holiday. Please ensure all your timesheets are submitted by Thursday EOD.\n\nEnjoy the long weekend!\n\nBest,\nHR Team",
    warningSigns: [],
    correctAnswer: "Proceed normally",
    explanation: "This is a routine, safe internal communication. It does not ask for credentials, create false urgency, or contain suspicious links.",
    recommendedAction: "Read the information and proceed with your day.",
    inspections: {
      sender: "Sender domain 'company.test' represents your legitimate internal corporate domain in this scenario.",
      link: "There are no links in this message.",
      message: "The message tone is normal, there is no artificial urgency, and it only requests routine timesheet submission without links."
    }
  }
];

export default function PhishingSimulator() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [activeInspection, setActiveInspection] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  
  const [stats, setStats] = useState({
    completed: 0,
    correct: 0,
    streak: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('cybershield_phishing_stats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved stats");
      }
    }
  }, []);

  const updateStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem('cybershield_phishing_stats', JSON.stringify(newStats));
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);
  };

  const scenario = SCENARIOS[currentScenarioIndex];
  const isCorrect = userAnswer !== null && (userAnswer === scenario.correctAnswer);

  const handleAnswer = (option) => {
    if (userAnswer !== null) return;
    
    const correct = option === scenario.correctAnswer;
    const newStats = {
      completed: stats.completed + 1,
      correct: stats.correct + (correct ? 1 : 0),
      streak: correct ? stats.streak + 1 : 0,
    };
    
    updateStats(newStats);
    setUserAnswer(option);
    setActiveInspection(null);
  };

  const nextScenario = () => {
    if (currentScenarioIndex < SCENARIOS.length - 1) {
      setCurrentScenarioIndex(i => i + 1);
      setUserAnswer(null);
      setActiveInspection(null);
    } else {
      // Loop back to start for endless training practice
      setCurrentScenarioIndex(0);
      setUserAnswer(null);
      setActiveInspection(null);
    }
  };

  const statsData = [
    { label: 'Scenario', value: `0${currentScenarioIndex + 1} / 0${SCENARIOS.length}`, icon: FiTarget },
    { label: 'Accuracy', value: `${stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : 0}%`, icon: FiActivity },
    { label: 'Correct', value: stats.correct.toString(), icon: FiAward },
    { label: 'Streak', value: stats.streak.toString(), icon: FiTrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-semibold text-text-primary">
              Phishing Simulator
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-medium font-mono uppercase tracking-wider">
              Interactive Security Training
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            Test your ability to identify phishing attempts through realistic security awareness scenarios.
          </p>
        </div>
        <div className="h-6 flex items-center">
          {hasSaved && (
            <span className="text-xs font-medium text-success flex items-center gap-1.5 animate-fade-in">
              <FiSave size={14} /> Progress saved locally
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <Card key={i} className="p-4 flex items-center gap-4 bg-bg-elevated border-border">
            <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
              <stat.icon className="text-accent" size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-display font-semibold text-text-primary">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Simulation Box (Left, col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-border bg-bg-elevated">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
              <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                <FiMail className="text-text-muted" /> Security Awareness Scenario
              </h3>
              <span className="text-xs px-2 py-1 bg-surface border border-border rounded text-text-secondary">
                Difficulty: {scenario.difficulty}
              </span>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Email Headers */}
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-3 text-sm">
                <div className="text-text-muted text-right font-medium">From:</div>
                <div className="text-text-primary font-medium">
                  {scenario.senderName} &lt;<span className="text-accent hover:underline cursor-help transition-colors" onClick={() => setActiveInspection('sender')}>{scenario.senderEmail}</span>&gt;
                </div>
                
                <div className="text-text-muted text-right font-medium">To:</div>
                <div className="text-text-primary">you@company.test</div>

                <div className="text-text-muted text-right font-medium">Date:</div>
                <div className="text-text-primary">{scenario.timestamp}</div>

                <div className="text-text-muted text-right font-medium">Subject:</div>
                <div className="text-text-primary font-bold">{scenario.subject}</div>
              </div>
              
              <hr className="border-border" />
              
              {/* Email Body */}
              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed py-2">
                {scenario.message}
              </div>
            </div>
          </Card>

          {/* Quiz / Feedback Section */}
          {userAnswer === null ? (
            <Card className="p-6 border-border shadow-sm">
              <h3 className="text-lg font-medium text-text-primary mb-6">What would you do with this message?</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {['Report as suspicious', 'Ignore / delete', 'Proceed normally'].map(option => (
                  <Button key={option} variant="outline" className="w-full hover:bg-surface-hover hover:border-accent hover:text-accent transition-colors" onClick={() => handleAnswer(option)}>
                    {option}
                  </Button>
                ))}
              </div>
            </Card>
          ) : (
            <Card className={`p-6 border-2 transition-colors ${isCorrect ? 'border-success/50 bg-success/5' : 'border-danger/50 bg-danger/5'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {isCorrect ? <FiCheckCircle size={24} className="text-success" /> : <FiAlertCircle size={24} className="text-danger" />}
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                      {isCorrect ? 'Correct identification' : 'Incorrect identification'}
                    </h3>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {scenario.explanation}
                    </p>
                  </div>

                  <div className="bg-bg-elevated border border-border rounded-lg p-4 space-y-2 shadow-sm">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recommended Action</h4>
                    <p className="text-sm font-medium text-text-primary">{scenario.recommendedAction}</p>
                  </div>

                  {scenario.warningSigns.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Detected Warning Signs</h4>
                      <div className="grid gap-2">
                        {scenario.warningSigns.map(sign => (
                          <div key={sign.id} className="p-3 bg-surface border border-border rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${sign.severity === 'High' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                              {sign.severity} Risk
                            </span>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{sign.label}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{sign.explanation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-2">
                    <Button variant="primary" onClick={nextScenario} className="group">
                      {currentScenarioIndex < SCENARIOS.length - 1 ? 'Next Scenario' : 'Restart Training'} 
                      <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: Inspect Tools */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-border bg-bg-elevated space-y-5">
            <div>
              <h3 className="text-base font-medium text-text-primary flex items-center gap-2 mb-2">
                <FiEye className="text-accent" /> Inspect Message
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Use these tools to analyze the simulated message for common phishing indicators before making your decision.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className={`justify-start text-sm py-2.5 ${activeInspection === 'sender' ? 'bg-surface-hover border-accent text-accent shadow-sm' : ''}`} 
                onClick={() => setActiveInspection('sender')}
                aria-label="Inspect Sender"
              >
                <FiUser className="mr-2" size={16} /> Inspect Sender
              </Button>
              <Button 
                variant="outline" 
                className={`justify-start text-sm py-2.5 ${activeInspection === 'link' ? 'bg-surface-hover border-accent text-accent shadow-sm' : ''}`} 
                onClick={() => setActiveInspection('link')}
                aria-label="Inspect Links"
              >
                <FiLink className="mr-2" size={16} /> Inspect Links
              </Button>
              <Button 
                variant="outline" 
                className={`justify-start text-sm py-2.5 ${activeInspection === 'message' ? 'bg-surface-hover border-accent text-accent shadow-sm' : ''}`} 
                onClick={() => setActiveInspection('message')}
                aria-label="Inspect Content"
              >
                <FiAlignLeft className="mr-2" size={16} /> Inspect Content
              </Button>
            </div>

            {activeInspection && (
              <div className="mt-4 p-4 bg-surface border border-border rounded-lg animate-fade-in relative shadow-sm">
                <button 
                  onClick={() => setActiveInspection(null)} 
                  className="absolute top-2.5 right-2.5 text-text-muted hover:text-text-primary transition-colors p-1"
                  aria-label="Close inspection panel"
                >
                  <FiX size={16} />
                </button>
                <h4 className="text-xs font-semibold text-text-primary mb-2.5 capitalize flex items-center gap-1.5">
                  <FiShield size={12} className="text-accent" /> {activeInspection} Analysis
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed pr-4">
                  {scenario.inspections[activeInspection]}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
