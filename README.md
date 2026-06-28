# CodeChef Contest Control Center

Hey there! This is the repository for the **CodeChef Contest Control Center**, a real-time simulated dashboard built for contest organizers to monitor and run competitive programming events. It's designed to give admins complete control over standings, rejudging, and freeze/thaw states on the fly.

---

## 🔗 Quick Links

* **Control Center**: https://controlcc.vercel.app/
---

## 📸 Screenshots

### 1. Operations Control Deck Overview
*(Placeholder for full dashboard layout screenshot showing dark/light mode toggle, Control Center header, and active widgets)*
![Dashboard Overview](https://placehold.co/1200x600/10141e/ffffff?text=Dashboard+Overview+Screenshot)

### 2. Standings Frozen Mode
*(Placeholder showing the Leaderboard with the translucent mechanical frosted glass lock overlay and frozen standings indicator)*
![Standings Frozen Mode](https://placehold.co/1200x600/10141e/ffffff?text=Standings+Frozen+Mode+Screenshot)

### 3. Timeline Rewind & Autoplay Controls
*(Placeholder showing the bottom sticky Contest Rewind dock at Minute X, along with the warning banner and play/pause slider)*
![Timeline Rewind](https://placehold.co/1200x600/10141e/ffffff?text=Timeline+Rewind+Dock+Screenshot)

### 4. Plagiarism Detection & Security Scanner
*(Placeholder showing the Security Scanner widget flagging duplicate codes with options to Disqualify or Clear)*
![Security Scanner](https://placehold.co/1200x600/10141e/ffffff?text=Security+Scanner+Screenshot)

### 5. Contest Analytics & Graphs
*(Placeholder showing the analytics panel charts: Pie chart of verdict distribution, stacked bar chart of solves/fails, timeline activity line chart, and horizontal language combat race)*
![Analytics Panel](https://placehold.co/1200x600/10141e/ffffff?text=Analytics+Charts+Screenshot)

### 6. Participant Registry & Filter Management
*(Placeholder showing the participant table with university filters, search bar, slider for maximum rank limit, and min solved count filter)*
![Participant Registry](https://placehold.co/1200x600/10141e/ffffff?text=Participant+Registry+Screenshot)

### 7. Live Submission Stream
*(Placeholder showing the real-time submission list filtering by verdict and problem with quick action buttons for manual rejudging)*
![Live Submission Stream](https://placehold.co/1200x600/10141e/ffffff?text=Submission+Stream+Screenshot)

---

## 🛠️ The Tech Stack

We kept things modular and performant:
* **Next.js 16 (App Router)**: Our core framework for page routing and layout structure.
* **Zustand**: Hands down the easiest way to handle shared state. It syncs automatically with `localStorage` so everything stays intact if you refresh.
* **Framer Motion**: Handles row re-ordering animations on the leaderboard, the safety cover switch, and particle explosions on first-bloods.
* **Recharts**: Powers the operational charts (submission timelines, language combat graphs, etc.).
* **Vanilla CSS**: Clean variables and custom animations without relying on bulky tailwind setups.
* **Lucide React**: Clean icons for widgets.

---

## 📂 Project Layout

Here is a quick look at where everything is:

```
src/
├── app/
│   ├── globals.css         # Styling variables (light/dark theme), custom scrollbars, animations
│   ├── layout.tsx          # Font loading and core HTML wrapping
│   └── page.tsx            # Main page - controls the loader and mounts the grid
├── components/
│   ├── DashboardGrid.tsx   # Manages widget ordering, timeline rewind, confetti, and toast popups
│   ├── CountdownDial.tsx   # Timer dial, light/dark theme switch, safety lock cover, standings freeze
│   ├── OverviewStats.tsx   # Quick KPI cards (active users, success rates, etc.)
│   ├── Leaderboard.tsx     # The CP leaderboard with visual indicators (streaks, active simulation highlights)
│   ├── Submissions.tsx     # Scrollable list of submissions with filters
│   ├── ParticipantTable.tsx# Table list of participants with search, sorting, and paging
│   ├── SecurityPanel.tsx   # Logs suspected duplicate code and allows manual disqualifications
│   ├── ActivityFeed.tsx    # Live feed of dashboard actions and events
│   ├── AnalyticsPanel.tsx  # Charts panel mapping submission stats and language popularity
│   ├── RejudgeModal.tsx    # Pop-up modal allowing admins to override submission verdicts
│   ├── BorderGlow.tsx      # Hover-glow card wrapper component
│   └── CubeLoader.tsx      # Solves-themed loading screen
├── store/
│   └── useContestStore.ts  # Zustand store that handles rankings logic, undo actions, and state changes
├── hooks/
│   └── useContestSimulator.ts # Simulates random participants joining and submitting code
└── utils/
    └── mockData.ts         # Preloaded problem sets, submissions, and participants
```

---

## 🧠 How We Handle State

Instead of overcomplicating things with Redux or Prop Drilling, we went with **Zustand**. 

Everything is driven by a single store (`useContestStore.ts`). Every time a participant submits a solution, or an admin changes a verdict:
1. The store catches the change.
2. It triggers our standings engine to recalculate ranks and penalty times.
3. Ranks are sorted: **Solved Problems** (descending) ➔ **Penalty Time** (ascending) ➔ **Alphabetical** (as a stable tie-breaker).
4. Disqualified participants are automatically flagged and pushed to the absolute bottom of the rankings.

**Side-Effect Free Features:**
For things like the **Timeline Rewind** and **Leaderboard Sandbox**, we avoid writing back to the store. Instead, we compute the state on-the-fly inside components (e.g. filtering submissions dynamically by timestamp or injecting a simulated row). This ensures you can play around with simulations and rewinds without corrupting the live-running simulation.

---

## 🔄 The Data Flow

```mermaid
graph LR;
    Action[Simulator / Admin Actions] --> Store[Zustand Store]
    Action2[Manual Rejudges] --> Store
    Store --> Recalculate[Recalculate Standings & Penalty]
    Recalculate --> State[Updated Standings Array]
    State --> View[Live Leaderboard & Analytics]
```

### Freeze & Thaw Workflow
* Toggling the freeze mode captures a deep copy of the standings at that moment.
* While frozen, the leaderboard displays this snapshot with a frosted glass visual overlay. Submissions continue streaming in the background, but the rankings do not change.
* Thawing the contest releases the snapshot, immediately updating the rankings and animating rows to their new positions.

---

## 💡 Assumptions Made

1. **Duration**: Default duration is set to 90 minutes. However, admins can change this at any time using the edit dial in the header.
2. **Mock Data Range**: The preloaded submission data spans up to minute 135. The timeline rewind slider dynamically adjusts its maximum limit to match either the elapsed time or the configured contest time.
3. **Plagiarism Matches**: Two submissions are flagged if they share the exact same timestamp, problem code, programming language, execution runtime, and verdict, but belong to different users.

---
