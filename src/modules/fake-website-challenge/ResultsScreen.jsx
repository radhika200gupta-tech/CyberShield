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
  let rankColorClass = "rank-trainee";
  let rankMessage = "Keep practicing! Phishing websites often use subtle tricks like misspelled URLs and false urgency.";

  if (percentage >= 80) {
    rankTitle = "Cyber Guardian";
    rankIcon = "🛡️";
    rankColorClass = "rank-guardian";
    rankMessage = "Outstanding! You have sharp security instincts and spot phishing tricks with ease.";
  } else if (percentage >= 50) {
    rankTitle = "Security Rookie";
    rankIcon = "🔍";
    rankColorClass = "rank-rookie";
    rankMessage = "Good job! You identified most fakes, but remember to always double-check domain extensions and HTTP status.";
  }

  return (
    <div className="results-container">
      <div className="results-card">
        <div className="results-badge-circle">
          <span className="results-badge-icon">{rankIcon}</span>
        </div>

        <h2 className="results-title">Challenge Complete!</h2>
        <p className="results-subtitle">Here is your security analysis report:</p>

        {/* Big Score Box */}
        <div className="score-summary-box">
          <div className="score-stat">
            <span className="stat-label">Final Score</span>
            <span className="stat-value">{props.score} / {props.totalPossibleScore}</span>
          </div>

          <div className="score-divider" />

          <div className="score-stat">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{percentage}%</span>
          </div>

          <div className="score-divider" />

          <div className="score-stat">
            <span className="stat-label">Correct Fakes Spotted</span>
            <span className="stat-value">{props.correctCount} of {props.totalChallenges}</span>
          </div>
        </div>

        {/* Rank Achievement */}
        <div className={"rank-box " + rankColorClass}>
          <span className="rank-eyebrow">Assigned Rank</span>
          <h3 className="rank-name">{rankTitle}</h3>
          <p className="rank-desc">{rankMessage}</p>
        </div>

        {/* Play Again Button */}
        <div className="results-action-area">
          <button
            type="button"
            className="play-again-button"
            onClick={props.onPlayAgain}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
