# **App Name**: MONOLITH Command Center

## Core Features:

- Customizable Theme: Theme context to manage fonts, radius, and accent colors for personalized visual experience.
- P2P Clipboard (Portal): Peer-to-peer text synchronization between devices using PeerJS DataConnection.
- Sensory Immersion: Sound effects ('Thock' on button click) and ambient audio toggles (Rain, Lo-Fi Hum, Binaural Beats) using Web Audio API.
- Pomodoro Timer: Countdown timer with a pulsing shadow on the container when active.
- Notepad: Monospaced scratchpad that saves content to localStorage on every keystroke.
- Priority Task List: Task list with 'Active' and 'Done' states. Completed items visually dim to 40% opacity.

## Style Guidelines:

- Background color: Dark gray (#0A0A0B) to provide a high contrast backdrop.
- Primary color: Vibrant magenta (#FF006E) for a bold, cyber-punk aesthetic.
- Accent colors: Electric cyan (#00F5FF) and toxic green (#ADFF2F) for highlights and interactive elements.
- Font family: 'Space Grotesk' sans-serif font to provide a modern, computerized look to both headers and body text
- Monospace Font: 'Source Code Pro' for the Notepad to give a code-editor feel.
- Three-column grid layout: Timer, Notepad, and Portal/Tasks organized in columns; adapts to flex-row on desktop and flex-col on mobile screens.
- Card styling: Solid 2px offset shadow (box-shadow: 2px 2px 0px 0px var(--accent)) for each card.
- Subtle animations: Heartbeat pulsing shadow on the Pomodoro timer when active.