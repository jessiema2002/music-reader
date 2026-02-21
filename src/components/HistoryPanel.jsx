import React, { useState } from 'react'
import { formatTime } from '../utils/recordUtils'

export default function HistoryPanel({ records }) {
  const [expanded, setExpanded] = useState(false)

  const hasRecords = records && records.length > 0
  const shown = expanded ? records : (records || []).slice(0, 8)
  const best = hasRecords
    ? records.reduce((b, r) => (!b || r.elapsedMs < b.elapsedMs ? r : b), null)
    : null

  return (
    <div className="history-panel">
      <div className="history-header">
        <span className="history-title">Past Runs</span>
        {best && (
          <span className="history-best">
            Best: <span className="history-best-time">{formatTime(best.elapsedMs)}</span>
          </span>
        )}
      </div>

      {!hasRecords ? (
        <div className="history-empty">No runs yet — complete a song to start tracking!</div>
      ) : (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Song</th>
                <th>Time</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => {
                const isBest = r.id === best?.id
                return (
                  <tr key={r.id} className={isBest ? 'history-row-best' : ''}>
                    <td className="history-rank">{i + 1}</td>
                    <td className="history-song" title={new Date(r.date).toLocaleString()}>
                      {r.title || 'Random'}
                    </td>
                    <td className="history-time">
                      {formatTime(r.elapsedMs)}
                      {isBest && <span className="history-crown"> 👑</span>}
                    </td>
                    <td className="history-score">
                      {r.score}/{r.songLength}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {records.length > 8 && (
            <button className="history-more-btn" onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'Show less' : `Show all ${records.length}`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
