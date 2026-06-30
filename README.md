# CodeChef Contest Control Center

Hey there! This is the repository for the **CodeChef Contest Control Center**, a real-time simulated dashboard built for contest organizers to monitor and run competitive programming events. It's designed to give admins complete control over standings, rejudging, and freeze/thaw states on the fly.

---

* **Control Center**: https://controlcc.vercel.app/
---

## 📸 Screenshots

### 1. Operations Control Deck Overview
* Dark Mode :
<img width="1918" height="967" alt="Screenshot 2026-06-28 163746" src="https://github.com/user-attachments/assets/313d4ff0-b3e6-4b71-a304-7a7182dcc7ae" />

* Light Mode :
<img width="1918" height="962" alt="Screenshot 2026-06-28 164836" src="https://github.com/user-attachments/assets/98df5934-223f-4aca-8df7-04033d486d19" />


### 2. Standings Frozen Mode
<img width="1282" height="937" alt="Screenshot 2026-06-28 163940" src="https://github.com/user-attachments/assets/b92805a2-7b8d-4393-8fae-3b72311c0679" />

### 3. Timeline Rewind & Autoplay Controls


https://github.com/user-attachments/assets/42d58d1d-7cae-4a4e-bcf9-99ff3d5a574d



### 4. Plagiarism Detection & Security Scanner
<img width="1896" height="476" alt="Screenshot 2026-06-28 164124" src="https://github.com/user-attachments/assets/98eb7a14-0e22-4cdb-8192-20dc0313aecf" />


### 5. Contest Analytics & Graphs
<img width="1918" height="438" alt="Screenshot 2026-06-28 164143" src="https://github.com/user-attachments/assets/199b4116-37fb-4eff-bb0c-7338b0467822" />


### 6. Participant Registry & Filter Management
<img width="1918" height="882" alt="Screenshot 2026-06-28 164117" src="https://github.com/user-attachments/assets/5ac0585c-a5f5-429d-8be4-1e573c80f01f" />


### 7. Live Submission Stream
<img width="1918" height="742" alt="Screenshot 2026-06-28 164132" src="https://github.com/user-attachments/assets/83c396d0-500d-4b78-9f65-734d4714b7eb" />

### 8. Persistent User Account Registration & Unified Passcode Lock
<img width="647" height="616" alt="Screenshot 2026-06-28 212749" src="https://github.com/user-attachments/assets/ed14eedc-abab-42ad-b42b-0661eb0cfe08" />


### 9. Interactive Analytics & Graph Detailed Drilldown
<img width="937" height="795" alt="Screenshot 2026-06-28 212733" src="https://github.com/user-attachments/assets/bf594510-4a77-48ac-b07b-b26469fa8cfb" />


### 10. Interactive "What-If" Rank Predictor


Uploading 20260628-1642-02.3922367.mp4…



---


## 🛠️ The Tech Stack

I kept things modular and performant:
* **Next.js 16 (App Router)**: My core framework for page routing and layout structure.
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

## 🧠 How I Handle State

Instead of overcomplicating things with Redux or Prop Drilling, I went with **Zustand**. 

Everything is driven by a single store (`useContestStore.ts`). Every time a participant submits a solution, or an admin changes a verdict:
1. The store catches the change.
2. It triggers the standings engine to recalculate ranks and penalty times.
3. Ranks are sorted: **Solved Problems** (descending) ➔ **Penalty Time** (ascending) ➔ **Alphabetical** (as a stable tie-breaker).
4. Disqualified participants are automatically flagged and pushed to the absolute bottom of the rankings.

**Side-Effect Free Features:**
For things like the **Timeline Rewind** and **Leaderboard Sandbox**, I have avoided writing back to the store. Instead, I computed the state inside components (e.g. filtering submissions dynamically by timestamp or injecting a simulated row). This ensures you can play around with simulations and rewinds without corrupting the live-running simulation.

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
