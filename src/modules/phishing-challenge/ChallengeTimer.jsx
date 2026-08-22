// ChallengeTimer.jsx
// Counts down from 10 seconds to 0 seconds using React's useEffect and setInterval.
// When time reaches 0, it calls props.onTimeout to alert the parent game component.

import { useState, useEffect } from "react";

export default function ChallengeTimer(props) {
  // Stores the remaining seconds (10 down to 0) so the component can re-render the countdown number on screen.
  const [secondsLeft, setSecondsLeft] = useState(props.duration);

  // Resets the countdown seconds back to the starting duration whenever a new question is loaded (when resetKey changes).
  useEffect(() => {
    // Put the timer back to the original starting number (for example: 10).
    setSecondsLeft(props.duration);
  }, [props.resetKey, props.duration]);

  // Runs a 1-second background clock while the challenge is active and handles the countdown logic.
  useEffect(() => {
    // Step 1: If the challenge is paused or already answered, do not start a timer.
    if (!props.isActive) {
      return;
    }

    // Step 2: If the timer has reached 0, tell the parent component that time ran out.
    if (secondsLeft <= 0) {
      if (props.onTimeout) {
        props.onTimeout();
      }
      return;
    }

    // Step 3: Start a browser interval that triggers every 1000 milliseconds (1 full second).
    const timerId = setInterval(() => {
      // Step 4: Decrease the remaining time by 1 second.
      setSecondsLeft((prevSeconds) => {
        return prevSeconds - 1;
      });
    }, 1000);

    // Step 5: THE CLEANUP FUNCTION:
    // This function runs automatically whenever this component unmounts (leaves the screen)
    // or right before useEffect runs again because secondsLeft or props changed.
    // We MUST call clearInterval(timerId) here. If we do not clean it up, the old timer
    // will keep running silently in the background, creating multiple competing clocks,
    // which causes the timer to tick down two or three times faster and wastes computer memory!
    return () => {
      clearInterval(timerId);
    };
  }, [props.isActive, secondsLeft, props.onTimeout]);

  // Calculate percentage of time remaining for the visual progress bar width
  const progressPercentage = (secondsLeft / props.duration) * 100;

  // Choose a color class depending on how much time is left
  let urgencyClass = "timer-normal";
  if (secondsLeft <= 3) {
    urgencyClass = "timer-critical";
  } else if (secondsLeft <= 6) {
    urgencyClass = "timer-warning";
  }

  return (
    <div className="challenge-timer-box">
      <div className="timer-info-row">
        <span className="timer-title">⏱️ Time Remaining</span>
        <span className={"timer-number " + urgencyClass}>
          {secondsLeft}s
        </span>
      </div>

      <div className="timer-track">
        <div
          className={"timer-fill " + urgencyClass}
          style={{ width: progressPercentage + "%" }}
        />
      </div>
    </div>
  );
}
