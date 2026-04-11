import React from 'react'
import { formatTime } from '../utils/recordUtils'

export default function ScoreBoard({ score, streak, total, elapsedMs }) {
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  return (
    <dl className="scoreboard" role="status" aria-live="polite" aria-label={`Score ${score} of ${total}, Streak ${streak}${total > 0 ? `, Accuracy ${accuracy}%` : ''}, Time ${formatTime(elapsedMs)}`}>
      <div className="scoreboard-item">
        <dt className="scoreboard-label">Score</dt>
        <dd className="scoreboard-value">
          {score}
          <span className="scoreboard-total">/{total}</span>
        </dd>
      </div>
      <div className="scoreboard-divider" aria-hidden="true" />
      <div className="scoreboard-item">
        <dt className="scoreboard-label">Streak</dt>
        <dd className="scoreboard-value streak-value">{streak}</dd>
      </div>
      {total > 0 && (
        <>
          <div className="scoreboard-divider" aria-hidden="true" />
          <div className="scoreboard-item">
            <dt className="scoreboard-label">Accuracy</dt>
            <dd className="scoreboard-value">
              {accuracy}%
            </dd>
          </div>
        </>
      )}
      <div className="scoreboard-divider" aria-hidden="true" />
      <div className="scoreboard-item">
        <dt className="scoreboard-label">Time</dt>
        <dd className="scoreboard-value time-value">{formatTime(elapsedMs)}</dd>
      </div>
    </dl>
  )
}
