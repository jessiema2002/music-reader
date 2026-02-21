# 🎵 Music Sight Reading

A web app for practicing music sight-reading. Notes are displayed on a staff and you identify them using a piano keyboard or your computer keyboard.

## Features

- **Song library** — 10 built-in treble clef melodies and 3 bass clef melodies (Ode to Joy, Twinkle Twinkle, Mary Had a Little Lamb, Frère Jacques, and more)
- **Random mode** — generates a random 8-note exercise
- **Multi-measure songs** — 16-note songs displayed 2 measures at a time, advancing automatically as you play
- **Treble & Bass clef** — toggle between clefs; piano keyboard shifts octaves accordingly
- **Two input methods** — click the on-screen piano keyboard or press A–G on your keyboard
- **Sound feedback** — plays the note you press using the Web Audio API (no dependencies)
- **Immediate feedback** — correct answers advance instantly; one wrong attempt allowed before moving on
- **Live timer** — starts on your first keypress, locks in when the song is complete
- **Progress history** — run history saved to localStorage with best time highlighted

## Tech Stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [VexFlow 4](https://www.vexflow.com/) for music notation rendering
- Web Audio API for sound synthesis
- `localStorage` for run history persistence
- Plain JavaScript (no TypeScript)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── StaffDisplay.jsx    # VexFlow staff renderer
│   ├── PianoKeyboard.jsx   # SVG piano keyboard
│   ├── ScoreBoard.jsx      # Score / streak / timer display
│   ├── HistoryPanel.jsx    # Past runs sidebar
│   └── SongPicker.jsx      # Song selector buttons
├── data/
│   └── songs.js            # Built-in song library
├── utils/
│   ├── noteUtils.js        # Note pools, random generation, answer checking
│   ├── recordUtils.js      # localStorage read/write for run history
│   └── audioUtils.js       # Web Audio API note synthesis
├── App.jsx                 # Main state machine
└── App.css                 # All styles
```

## How to Play

1. Select a song from the picker (or leave it on 🎲 Random)
2. Notes appear on the staff — the **amber** note is the one to identify
3. Press the matching letter key (**A–G**) or click the piano key
4. Correct → turns **green** and advances immediately
5. Wrong → one retry allowed; second wrong reveals the answer and moves on
6. Finish all notes to see your score and time

## Deploying

The `dist/` folder produced by `npm run build` is a static site — host it anywhere:

- **Netlify**: drag-and-drop `dist/` at [netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo with build command `npm run build` and publish directory `dist`
- **Vercel**: `npx vercel` in the project folder
- **GitHub Pages**: uncomment `base: '/music-reader/'` in `vite.config.js`, build, then deploy `dist/`
