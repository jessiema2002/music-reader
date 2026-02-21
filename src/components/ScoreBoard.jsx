import React from 'react'
import { formatTime } from '../utils/recordUtils'

export default function ScoreBoard({ score, streak, total, elapsedMs }) {
  return (
    <div className="scoreboard">
      <div className="scoreboard-item">
        <span className="scoreboard-label">Score</span>
        <span className="scoreboard-value">
          {score}
          <span className="scoreboard-total">/{total}</span>
        </span>
      </div>
      <div className="scoreboard-divider" />
      <div className="scoreboard-item">
        <span className="scoreboard-label">Streak</span>
        <span className="scoreboard-value streak-value">{streak}</span>
      </div>
      {total > 0 && (
        <>
          <div className="scoreboard-divider" />
          <div className="scoreboard-item">
            <span className="scoreboard-label">Accuracy</span>
            <span className="scoreboard-value">
              {Math.round((score / total) * 100)}%
            </span>
          </div>
        </>
      )}
      <div className="scoreboard-divider" />
      <div className="scoreboard-item">
        <span className="scoreboard-label">Time</span>
        <span className="scoreboard-value time-value">{formatTime(elapsedMs)}</span>
      </div>
    </div>
  )
}
