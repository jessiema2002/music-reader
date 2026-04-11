import React from 'react'
import StaffDisplay from './StaffDisplay'

export default function StaffCard({
  songComplete, selectedSong, currentIndex, songLength,
  measureLabel, feedbackMsg,
  windowStart, windowNotes, windowIndex, windowResults, clef,
}) {
  const label = songComplete
    ? `Complete!${selectedSong ? ` — ${selectedSong.title}` : ''}${measureLabel}`
    : `${selectedSong ? `${selectedSong.title} — ` : ''}Note ${currentIndex + 1} of ${songLength}${measureLabel}`

  return (
    <div className="card staff-card">
      <h2 className="card-label">{label}</h2>
      <StaffDisplay
        key={windowStart}
        song={windowNotes}
        currentIndex={windowIndex}
        results={windowResults}
        clef={clef}
      />
      <div
        className={`feedback-message ${feedbackMsg ? `feedback-${feedbackMsg.type}` : ''}`}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {feedbackMsg ? feedbackMsg.text : ''}
      </div>
    </div>
  )
}
