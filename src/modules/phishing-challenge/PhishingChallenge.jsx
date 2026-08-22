// PhishingChallenge.jsx
// Main container component for the "Phishing Challenge".
// Holds all game state (current question, score, timer status, user choice, game over).

import { useState } from "react";

import WebsiteCard from "./WebsiteCard";
import ChallengeTimer from "./ChallengeTimer";
import ResultsScreen from "./ResultsScreen";
import { challenges } from "./challengeData";
import "./PhishingChallenge.css";

export default function PhishingChallenge() {
  // Stores the index number of the active challenge (0 to 4) so we know which question to show.
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stores the player's total accumulated score (+100 points for every correct answer).
  const [score, setScore] = useState(0);

  // Stores which website option the user clicked ('A' or 'B', or null if they have not clicked yet).
  const [selectedOption, setSelectedOption] = useState(null);

  // Tracks whether the current challenge has been answered or timed out to stop the timer and show feedback.
  const [isAnswered, setIsAnswered] = useState(false);

  // Tracks whether the player ran out of time on the current challenge.
  const [isTimeout, setIsTimeout] = useState(false);

  // Tracks how many challenges were answered correctly to calculate the final accuracy rate.
  const [correctCount, setCorrectCount] = useState(0);

  // Tracks whether all 5 challenges have been completed so we can display the ResultsScreen.
  const [isGameOver, setIsGameOver] = useState(false);

  // Grab the current challenge object from our array
  const currentChallenge = challenges[currentIndex];
  const totalChallenges = challenges.length;
  const totalPossibleScore = totalChallenges * 100;

  // Called when the user clicks on Website Card A or Website Card B
  function handleSelectWebsite(option) {
    if (isAnswered) {
      return;
    }

    setSelectedOption(option);
    setIsAnswered(true);
    setIsTimeout(false);

    // Check if the user's choice matches the correct fake website
    if (option === currentChallenge.correctAnswer) {
      setScore((prevScore) => prevScore + 100);
      setCorrectCount((prevCount) => prevCount + 1);
    }
  }

  // Called by ChallengeTimer when the 10-second countdown reaches 0
  function handleTimeout() {
    if (isAnswered) {
      return;
    }

    setIsAnswered(true);
    setIsTimeout(true);
    setSelectedOption(null);
  }

  // Called when clicking the "Next Challenge →" button
  function handleNextChallenge() {
    if (currentIndex + 1 < totalChallenges) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsTimeout(false);
    } else {
      setIsGameOver(true);
    }
  }

  // Called when clicking "Play Again" on the ResultsScreen
  function handlePlayAgain() {
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setIsGameOver(false);
  }

  // Determine feedback outcome
  const isCorrect = selectedOption === currentChallenge.correctAnswer;

  return (
    <div className="challenge-page-wrapper">
      {/* Background visual grid pattern */}
      <div className="absolute inset-0 grid-fade pointer-events-none" />



      <main className="challenge-main-container">
        {/* If the game is finished, show the ResultsScreen */}
        {isGameOver ? (
          <ResultsScreen
            score={score}
            totalPossibleScore={totalPossibleScore}
            correctCount={correctCount}
            totalChallenges={totalChallenges}
            onPlayAgain={handlePlayAgain}
          />
        ) : (
          <div>
            {/* Page Header */}
            <div className="challenge-hero">
              <div className="hero-shield-icon">
                🎯
              </div>

              <p className="hero-tag">
                CyberShield · Interactive Phishing Quiz
              </p>

              <h1 className="hero-title">
                Phishing <span className="text-gradient">Challenge</span>
              </h1>

              <p className="hero-description">
                Inspect both website mockups below. Spot the phishing site and click it before time runs out!
              </p>
            </div>

            {/* Game Stats Bar */}
            <div className="game-stats-bar">
              <span className="stat-pill">
                Challenge: <span className="stat-pill-highlight">{currentIndex + 1} of {totalChallenges}</span>
              </span>
              <span className="stat-pill">
                Current Score: <span className="stat-pill-score">{score} pts</span>
              </span>
            </div>

            {/* 10-Second Countdown Timer */}
            <ChallengeTimer
              duration={10}
              isActive={!isAnswered}
              onTimeout={handleTimeout}
              resetKey={currentIndex}
            />

            {/* Subtitle prompt */}
            <div className="challenge-prompt-banner">
              <span className="prompt-text">
                ⚠️ Click on the website that you think is <strong>FAKE (Phishing)</strong>:
              </span>
            </div>

            {/* Side-by-Side Website Cards Comparison */}
            <div className="cards-comparison-grid">
              <WebsiteCard
                label="A"
                website={currentChallenge.websiteA}
                isSelected={selectedOption === "A"}
                isFakeWebsite={currentChallenge.correctAnswer === "A"}
                showResult={isAnswered}
                onSelect={handleSelectWebsite}
                disabled={isAnswered}
              />

              <WebsiteCard
                label="B"
                website={currentChallenge.websiteB}
                isSelected={selectedOption === "B"}
                isFakeWebsite={currentChallenge.correctAnswer === "B"}
                showResult={isAnswered}
                onSelect={handleSelectWebsite}
                disabled={isAnswered}
              />
            </div>

            {/* Answer Feedback and Next Challenge Button */}
            {isAnswered ? (
              <div
                className={
                  "feedback-container " +
                  (isTimeout
                    ? "feedback-timeout"
                    : isCorrect
                    ? "feedback-correct"
                    : "feedback-incorrect")
                }
              >
                <div className="feedback-status-row">
                  <span className="feedback-status-title">
                    {isTimeout
                      ? "⏰ Time's Up!"
                      : isCorrect
                      ? "✅ Correct! Great Eye!"
                      : "❌ Incorrect Choice!"}
                  </span>

                  <span className="feedback-points-badge">
                    {isCorrect ? "+100 Points" : "+0 Points"}
                  </span>
                </div>

                <p className="feedback-explanation">
                  <strong>Why: </strong>
                  {currentChallenge.explanation}
                </p>

                <div className="feedback-action-row">
                  <button
                    type="button"
                    className="next-button"
                    onClick={handleNextChallenge}
                  >
                    {currentIndex + 1 < totalChallenges
                      ? "Next Challenge →"
                      : "View Final Results →"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
