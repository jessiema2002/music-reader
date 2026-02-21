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
      <div className="card-label">{label}</div>
      <StaffDisplay
        key={windowStart}
        song={windowNotes}
        currentIndex={windowIndex}
        results={windowResults}
        clef={clef}
      />
      {feedbackMsg && (
        <div className={`feedback-message feedback-${feedbackMsg.type}`}>
          {feedbackMsg.text}
        </div>
      )}
    </div>
  )
}
