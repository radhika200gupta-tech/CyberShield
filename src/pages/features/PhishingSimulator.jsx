import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  FiCheckCircle, FiAlertCircle, FiArrowRight, FiShield, FiMail, 
  FiEye, FiUser, FiLink, FiAlignLeft, FiX, FiActivity, FiTarget, 
  FiTrendingUp, FiAward, FiSave, FiAlertTriangle, FiInfo
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
  const progressPercent = ((currentScenarioIndex + 1) / SCENARIOS.length) * 100;

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
    { label: 'Accuracy', value: `${stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : 0}%`, icon: FiActivity },
    { label: 'Correct', value: stats.correct.toString(), icon: FiAward },
    { label: 'Streak', value: stats.streak.toString(), icon: FiTrendingUp },
  ];

  const getDifficultyColor = (diff) => {
    if(diff === 'Beginner') return 'bg-success/10 text-success border-success/20';
    if(diff === 'Intermediate') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-danger/10 text-danger border-danger/20';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-semibold text-text-primary">
              Phishing Training Lab
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-medium font-mono uppercase tracking-wider">
              Interactive security awareness training
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

      {/* Progress & Stats Row */}
      <Card className="p-5 bg-bg-elevated border-border animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Training Progress</h3>
              <span className="text-sm font-medium text-text-primary">Scenario {currentScenarioIndex + 1} of {SCENARIOS.length}</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
              <motion.div 
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="flex gap-4 md:gap-8">
            {statsData.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center shrink-0">
                  <stat.icon className="text-accent" size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-display font-semibold text-text-primary leading-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Simulation Box (Left, col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-border bg-bg-elevated shadow-sm">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-surface">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <FiMail className="text-text-muted" /> Simulated Inbox
                  </h3>
                  <div className={`text-xs px-2.5 py-1 border rounded-md font-medium uppercase tracking-wider ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Email Viewer Frame */}
                  <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
                    {/* Fake Window Controls */}
                    <div className="bg-bg-elevated px-4 py-2 border-b border-border flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                      </div>
                      <span className="text-[10px] text-text-muted ml-2 font-mono tracking-widest uppercase">SecMail Viewer</span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Email Headers */}
                      <div className="grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 text-sm bg-bg-elevated p-4 rounded-md border border-border/50">
                        <div className="text-text-muted text-right font-medium">From:</div>
                        <div className="text-text-primary">
                          <span className="font-semibold mr-2">{scenario.senderName}</span> 
                          &lt;<button 
                            className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                            onClick={() => setActiveInspection('sender')}
                            aria-label="Inspect Sender Domain"
                          >{scenario.senderEmail}</button>&gt;
                        </div>
                        
                        <div className="text-text-muted text-right font-medium">To:</div>
                        <div className="text-text-primary">you@company.test</div>

                        <div className="text-text-muted text-right font-medium">Date:</div>
                        <div className="text-text-primary">{scenario.timestamp}</div>

                        <div className="text-text-muted text-right font-medium mt-2 pt-2 border-t border-border/50">Subject:</div>
                        <div className="text-text-primary font-semibold mt-2 pt-2 border-t border-border/50">{scenario.subject}</div>
                      </div>
                      
                      {/* Email Body */}
                      <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed py-3 px-2">
                        {scenario.message}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quiz / Feedback Section */}
              <div className="mt-6">
                {userAnswer === null ? (
                  <Card className="p-6 border-border bg-bg-elevated shadow-sm">
                    <h3 className="text-base font-medium text-text-primary mb-4 flex items-center gap-2">
                      <FiShield className="text-accent" /> What is your security decision?
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {['Report as suspicious', 'Ignore / delete', 'Proceed normally'].map(option => (
                        <Button 
                          key={option} 
                          variant="outline" 
                          className="w-full h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-hover hover:border-accent hover:text-accent transition-all text-sm font-medium" 
                          onClick={() => handleAnswer(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`overflow-hidden border-2 transition-colors ${isCorrect ? 'border-success/50 bg-success/5' : 'border-danger/50 bg-danger/5'}`}>
                      <div className={`px-6 py-4 border-b ${isCorrect ? 'border-success/20 bg-success/10' : 'border-danger/20 bg-danger/10'} flex items-center gap-3`}>
                        {isCorrect ? <FiCheckCircle size={20} className="text-success" /> : <FiAlertCircle size={20} className="text-danger" />}
                        <h3 className={`text-lg font-semibold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                          {isCorrect ? 'Correct Decision' : 'Incorrect Decision'}
                        </h3>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Analysis Explanation</h4>
                          <p className="text-sm text-text-primary leading-relaxed bg-surface p-4 rounded-lg border border-border">
                            {scenario.explanation}
                          </p>
                        </div>

                        {scenario.warningSigns.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Detected Warning Signs</h4>
                            <div className="grid gap-3">
                              {scenario.warningSigns.map(sign => (
                                <div key={sign.id} className="p-3 bg-surface border border-border rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
                                  <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider shrink-0 ${sign.severity === 'High' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
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

                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recommended Protocol</h4>
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                            <FiInfo className="text-primary mt-0.5 shrink-0" size={16} />
                            <p className="text-sm font-medium text-text-primary">{scenario.recommendedAction}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-2 border-t border-border/50">
                          <Button variant="primary" onClick={nextScenario} className="group px-6">
                            {currentScenarioIndex < SCENARIOS.length - 1 ? 'Next Training Scenario' : 'Restart Training Lab'} 
                            <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar: Inspect Tools */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 border-border bg-bg-elevated">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-2">
                <FiEye className="text-accent" /> Inspection Tools
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Analyze specific elements of the message for phishing indicators before making your decision.
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <Button 
                variant="outline" 
                className={`justify-start text-sm py-2.5 px-4 transition-all ${activeInspection === 'sender' ? 'bg-accent/10 border-accent text-accent shadow-sm' : 'hover:border-text-muted'}`} 
                onClick={() => setActiveInspection('sender')}
                aria-label="Inspect Sender"
              >
                <FiUser className={`mr-3 ${activeInspection === 'sender' ? 'text-accent' : 'text-text-muted'}`} size={16} /> 
                <span className="font-medium">Inspect Sender</span>
              </Button>
              <Button 
                variant="outline" 
                className={`justify-start text-sm py-2.5 px-4 transition-all ${activeInspection === 'link' ? 'bg-accent/10 border-accent text-accent shadow-sm' : 'hover:border-text-muted'}`} 
                onClick={() => setActiveInspection('link')}
                aria-label="Inspect Links"
              >
                <FiLink className={`mr-3 ${activeInspection === 'link' ? 'text-accent' : 'text-text-muted'}`} size={16} /> 
                <span className="font-medium">Inspect Links</span>
              </Button>
              <Button 
                variant="outline" 
                className={`justify-start text-sm py-2.5 px-4 transition-all ${activeInspection === 'message' ? 'bg-accent/10 border-accent text-accent shadow-sm' : 'hover:border-text-muted'}`} 
                onClick={() => setActiveInspection('message')}
                aria-label="Inspect Content"
              >
                <FiAlignLeft className={`mr-3 ${activeInspection === 'message' ? 'text-accent' : 'text-text-muted'}`} size={16} /> 
                <span className="font-medium">Inspect Content</span>
              </Button>
            </div>

            <AnimatePresence>
              {activeInspection && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="p-4 bg-surface border border-accent/30 rounded-lg relative shadow-sm">
                    <button 
                      onClick={() => setActiveInspection(null)} 
                      className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                      aria-label="Close inspection panel"
                    >
                      <FiX size={16} />
                    </button>
                    <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FiAlertTriangle size={14} /> {activeInspection} Analysis
                    </h4>
                    <p className="text-sm text-text-primary leading-relaxed pr-6">
                      {scenario.inspections[activeInspection]}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}
