// PhishingChallenge.jsx
// Main container component for the "Phishing Challenge".
// Holds all game state (current question, score, timer status, user choice, game over).

import { useState } from "react";
import { FiTarget } from "react-icons/fi";

import WebsiteCard from "./WebsiteCard";
import ChallengeTimer from "./ChallengeTimer";
import ResultsScreen from "./ResultsScreen";
import { challenges } from "./challengeData";
import PageHeader from "../../components/common/PageHeader";

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
    <div className="min-h-screen relative overflow-x-hidden pb-20">




      <main className="max-w-4xl mx-auto px-4 pt-8">
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
          <div className="space-y-8">
            <PageHeader 
              title="Phishing Awareness Challenge"
              description="Inspect both website mockups below. Spot the phishing site and click it before time runs out!"
              badge="Interactive Quiz"
              icon={<FiTarget />}
            />

            {/* Game Stats Bar */}
            <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3 mb-6 flex-wrap gap-2">
              <span className="font-mono text-[0.85rem] text-text-secondary">
                Challenge: <span className="text-accent font-bold">{currentIndex + 1} of {totalChallenges}</span>
              </span>
              <span className="font-mono text-[0.85rem] text-text-secondary">
                Current Score: <span className="text-success font-bold">{score} pts</span>
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
            <div className="text-center mb-5">
              <span className="inline-block text-[0.9rem] text-text-secondary bg-accent/10 border border-accent/20 py-1.5 px-4 rounded-full">
                ⚠️ Click on the website that you think is <strong>FAKE (Phishing)</strong>:
              </span>
            </div>

            {/* Side-by-Side Website Cards Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                className={`bg-surface border rounded-[14px] p-6 mb-8 transition-colors ${isTimeout ? 'border-danger/40 bg-gradient-to-b from-danger/10 to-surface' : isCorrect ? 'border-success/40 bg-gradient-to-b from-success/10 to-surface' : 'border-danger/40 bg-gradient-to-b from-danger/10 to-surface'}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <span className={`text-[1.15rem] font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                    {isTimeout
                      ? "⏰ Time's Up!"
                      : isCorrect
                      ? "✅ Correct! Great Eye!"
                      : "❌ Incorrect Choice!"}
                  </span>

                  <span className={`font-mono text-[0.85rem] font-bold py-1 px-2.5 rounded-md ${isCorrect ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                    {isCorrect ? "+100 Points" : "+0 Points"}
                  </span>
                </div>

                <p className="text-[0.92rem] text-text-secondary leading-relaxed mb-5">
                  <strong>Why: </strong>
                  {currentChallenge.explanation}
                </p>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-primary hover:bg-primary-dim text-white font-semibold text-[0.9rem] py-2.5 px-6 rounded-lg transition-transform hover:-translate-y-[1px]"
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


