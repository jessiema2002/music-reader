import React from 'react'
import { formatTime } from '../utils/recordUtils'

export default function SongResultCard({ correctCount, songLength, finalMs, onNewSong }) {
  const perfect = correctCount === songLength
  return (
    <div className="card song-complete-card">
      <div className="song-complete-title">Song Result</div>
      <div className="song-complete-score">
        <span className="song-complete-num">{correctCount}</span>
        <span className="song-complete-denom">/ {songLength}</span>
      </div>
      <div className="song-complete-time">{formatTime(finalMs)}</div>
      <div className="song-complete-label">
        {perfect ? 'Perfect! 🎵' : `${songLength - correctCount} note${songLength - correctCount > 1 ? 's' : ''} missed`}
      </div>
      <button className="new-song-btn" onClick={onNewSong}>New Song</button>
    </div>
  )
}
