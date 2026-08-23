// ResultsScreen.jsx
// Displays the final quiz summary after all challenges are finished.
// Calculates the player's percentage score, cybersecurity rank badge, and gives a Play Again button.

export default function ResultsScreen(props) {
  // Calculate percentage (for example: 400 / 500 = 80%)
  let percentage = 0;
  if (props.totalPossibleScore > 0) {
    percentage = Math.round((props.score / props.totalPossibleScore) * 100);
  }

  // Determine the rank title, icon, and summary message based on percentage
  let rankTitle = "Security Trainee";
  let rankIcon = "⚠️";
  let rankColorClass = "bg-warning/10 border-warning/30";
  let rankMessage = "Keep practicing! Phishing websites often use subtle tricks like misspelled URLs and false urgency.";

  if (percentage >= 80) {
    rankTitle = "Cyber Guardian";
    rankIcon = "🛡️";
    rankColorClass = "bg-success/10 border-success/30";
    rankMessage = "Outstanding! You have sharp security instincts and spot phishing tricks with ease.";
  } else if (percentage >= 50) {
    rankTitle = "Security Rookie";
    rankIcon = "🔍";
    rankColorClass = "bg-accent/10 border-accent/30";
    rankMessage = "Good job! You identified most fakes, but remember to always double-check domain extensions and HTTP status.";
  }

  return (
    <div className="flex justify-center pt-4">
      <div className="bg-surface border border-border rounded-2xl p-10 max-w-lg w-full text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-full bg-accent/10 border-2 border-accent/30 mb-5">
          <span className="text-[2.2rem]">{rankIcon}</span>
        </div>

        <h2 className="font-display text-[1.6rem] font-bold text-text-primary">Challenge Complete!</h2>
        <p className="text-[0.9rem] text-text-secondary mt-1 mb-7">Here is your security analysis report:</p>

        {/* Big Score Box */}
        <div className="flex items-center justify-around bg-bg-elevated border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[0.72rem] uppercase tracking-wider text-text-muted">Final Score</span>
            <span className="font-mono text-[1.15rem] font-bold text-text-primary">{props.score} / {props.totalPossibleScore}</span>
          </div>

          <div className="w-px h-8 bg-border" />

          <div className="flex flex-col gap-1">
            <span className="text-[0.72rem] uppercase tracking-wider text-text-muted">Accuracy</span>
            <span className="font-mono text-[1.15rem] font-bold text-text-primary">{percentage}%</span>
          </div>

          <div className="w-px h-8 bg-border" />

          <div className="flex flex-col gap-1">
            <span className="text-[0.72rem] uppercase tracking-wider text-text-muted">Correct Fakes Spotted</span>
            <span className="font-mono text-[1.15rem] font-bold text-text-primary">{props.correctCount} of {props.totalChallenges}</span>
          </div>
        </div>

        {/* Rank Achievement */}
        <div className={`text-left rounded-xl p-5 mb-8 border ${rankColorClass}`}>
          <span className="block text-[0.7rem] uppercase tracking-[0.12em] text-text-muted mb-1">Assigned Rank</span>
          <h3 className="font-display text-[1.25rem] font-bold text-text-primary mb-1.5">{rankTitle}</h3>
          <p className="text-[0.82rem] text-text-secondary leading-snug">{rankMessage}</p>
        </div>

        {/* Play Again Button */}
        <div className="mt-4">
          <button
            type="button"
            className="bg-primary hover:bg-primary-dim text-white font-semibold text-[0.95rem] py-3 px-8 rounded-lg transition-transform hover:-translate-y-[1px]"
            onClick={props.onPlayAgain}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

