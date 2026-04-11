import React from 'react'
import { formatTime } from '../utils/recordUtils'

export default function SongResultCard({ correctCount, songLength, finalMs, onNewSong }) {
  const perfect = correctCount === songLength
  return (
    <div className="card song-complete-card" role="alert" aria-label={`Song complete. Score: ${correctCount} out of ${songLength}. Time: ${formatTime(finalMs)}`}>
      <h2 className="song-complete-title">Song Result</h2>
      <div className="song-complete-score">
        <span className="song-complete-num">{correctCount}</span>
        <span className="song-complete-denom">/ {songLength}</span>
      </div>
      <div className="song-complete-time">{formatTime(finalMs)}</div>
      <div className="song-complete-label">
        {perfect ? (<>Perfect! <span aria-hidden="true">🎵</span></>) : `${songLength - correctCount} note${songLength - correctCount > 1 ? 's' : ''} missed`}
      </div>
      <button className="new-song-btn" onClick={onNewSong}>New Song</button>
    </div>
  )
}
