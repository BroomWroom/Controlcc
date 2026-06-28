import { create } from 'zustand';
import { 
  PROBLEMS, 
  INITIAL_PARTICIPANTS, 
  INITIAL_SUBMISSIONS, 
  INITIAL_ACTIVITIES,
  Participant, 
  Submission, 
  ContestActivity,
  Problem
} from '../utils/mockData';

export interface PlagiarismFlag {
  id: string;
  participantA: string;
  participantB: string;
  problemCode: string;
  submissionIdA: string;
  submissionIdB: string;
  status: 'Pending' | 'Investigated' | 'Cleared';
  timestamp: number;
}

interface RejudgeHistory {
  submissionId: string;
  previousVerdict: Submission['verdict'];
  previousExecutionTime: number;
}

interface ContestState {
  participants: Participant[];
  submissions: Submission[];
  activities: ContestActivity[];
  problems: Problem[];
  freezeMode: boolean;
  frozenLeaderboard: Participant[] | null;
  contestStatus: 'Upcoming' | 'Live' | 'Ended';
  timeRemaining: number;
  totalContestMinutes: number;  // Full contest duration in minutes (dynamic)
  rejudgeHistory: RejudgeHistory[];
  
  // New States
  sandboxSimulation: { name: string; problemCode: string } | null;
  rewindMinute: number | null;
  plagiarismFlags: PlagiarismFlag[];
  latestFirstBlood: { participantName: string; problemCode: string } | null;
  
  isAdminAuthenticated: boolean;
  adminAuthModalOpen: boolean;
  pendingAdminAction: (() => void) | null;

  addSubmission: (submission: Omit<Submission, 'id'> & { id?: string }) => string;
  resolveSubmission: (id: string, verdict: Submission['verdict'], executionTime: number) => void;
  rejudgeSubmission: (id: string, newVerdict: Submission['verdict']) => void;
  undoLastRejudge: () => void;
  toggleFreezeMode: () => void;
  setContestStatus: (status: 'Upcoming' | 'Live' | 'Ended') => void;
  tickTime: (amount: number) => void;
  addActivity: (type: ContestActivity['type'], description: string) => void;
  resetContest: () => void;
  addParticipant: (name: string, institution: string) => void;
  setContestTime: (minutes: number) => void;

  // New Actions
  setSandboxSimulation: (simulation: { name: string; problemCode: string } | null) => void;
  setRewindMinute: (minute: number | null) => void;
  resolvePlagiarismFlag: (id: string, status: PlagiarismFlag['status']) => void;
  clearLatestFirstBlood: () => void;
  disqualifyParticipant: (name: string) => void;
  clearParticipantStatus: (name: string) => void;

  setAdminAuthenticated: (auth: boolean) => void;
  setAdminAuthModalOpen: (open: boolean) => void;
  setPendingAdminAction: (action: (() => void) | null) => void;
}

export const calculateStandings = (
  participants: Participant[],
  submissions: Submission[],
  problems: Problem[]
): Participant[] => {
  const updatedParticipants = participants.map((p) => {
    const pSubmissions = submissions.filter((s) => s.participantName === p.name);
    const solvedProblems: string[] = [];
    const problemAttempts: Participant['problemAttempts'] = {};
    let solvedCount = 0;
    let penaltyTime = 0;

    problems.forEach((prob) => {
      const probSubs = pSubmissions.filter((s) => s.problemCode === prob.code);
      
      const firstAC = probSubs.find((s) => s.verdict === 'Accepted');
      const attemptsBeforeAC = firstAC 
        ? probSubs.filter((s) => s.timestamp < firstAC.timestamp && s.verdict !== 'Pending' && s.verdict !== 'Running').length
        : probSubs.filter((s) => s.verdict !== 'Pending' && s.verdict !== 'Running').length;

      if (firstAC) {
        solvedCount++;
        solvedProblems.push(prob.code);
        problemAttempts[prob.code] = {
          attempts: attemptsBeforeAC + 1,
          solvedTime: firstAC.timestamp,
        };
        penaltyTime += firstAC.timestamp + attemptsBeforeAC * 20;
      } else {
        problemAttempts[prob.code] = {
          attempts: attemptsBeforeAC,
          solvedTime: null,
        };
      }
    });

    return {
      ...p,
      solvedProblems,
      problemAttempts,
      solvedCount,
      penaltyTime,
    };
  });

  const sorted = [...updatedParticipants].sort((a, b) => {
    if (a.status === 'Disqualified' && b.status !== 'Disqualified') return 1;
    if (b.status === 'Disqualified' && a.status !== 'Disqualified') return -1;
    
    if (a.solvedCount !== b.solvedCount) {
      return b.solvedCount - a.solvedCount;
    }
    if (a.penaltyTime !== b.penaltyTime) {
      return a.penaltyTime - b.penaltyTime;
    }
    return a.name.localeCompare(b.name);
  });

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].status === 'Disqualified') {
      sorted[i].rank = -1;
      continue;
    }
    if (i > 0 && sorted[i].solvedCount === sorted[i - 1].solvedCount && sorted[i].penaltyTime === sorted[i - 1].penaltyTime) {
      sorted[i].rank = sorted[i - 1].rank;
    } else {
      sorted[i].rank = currentRank;
    }
    currentRank++;
  }

  return sorted;
};

const validateSavedState = (parsed: any): boolean => {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.submissions) || !Array.isArray(parsed.activities) || !Array.isArray(parsed.problems)) return false;
  if (typeof parsed.freezeMode !== 'boolean') return false;
  if (typeof parsed.timeRemaining !== 'number') return false;

  // Deep validation of participant list
  const isValidParticipant = (p: any) => 
    p && 
    typeof p.name === 'string' && 
    typeof p.institution === 'string' && 
    Array.isArray(p.solvedProblems) && 
    p.problemAttempts && 
    typeof p.solvedCount === 'number';
  if (!parsed.participants.every(isValidParticipant)) return false;

  // Deep validation of submissions list
  const isValidSubmission = (s: any) => 
    s && 
    typeof s.id === 'string' && 
    typeof s.participantName === 'string' && 
    typeof s.problemCode === 'string';
  if (!parsed.submissions.every(isValidSubmission)) return false;

  return true;
};

const getInitialState = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('contest_control_center_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (validateSavedState(parsed)) {
          return {
            participants: parsed.participants,
            submissions: parsed.submissions.map((s: any) => ({
              ...s,
              codeChecksum: s.codeChecksum || `checksum_sub_${Math.random().toString(36).substring(2, 10)}`
            })),
            activities: parsed.activities,
            problems: parsed.problems,
            freezeMode: parsed.freezeMode,
            frozenLeaderboard: parsed.frozenLeaderboard || null,
            contestStatus: parsed.contestStatus || 'Live',
            timeRemaining: parsed.timeRemaining,
            rejudgeHistory: parsed.rejudgeHistory || [],
            sandboxSimulation: null,
            rewindMinute: null,
            latestFirstBlood: null,
            plagiarismFlags: parsed.plagiarismFlags || [],
            totalContestMinutes: parsed.totalContestMinutes || Math.round((parsed.timeRemaining || 5400) / 60) || 90,
            
            isAdminAuthenticated: false,
            adminAuthModalOpen: false,
            pendingAdminAction: null,
          };
        } else {
          console.warn('Saved state failed validation. Discarding corrupted cache.');
          localStorage.removeItem('contest_control_center_state');
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
  }
  return {
    participants: calculateStandings(INITIAL_PARTICIPANTS, INITIAL_SUBMISSIONS, PROBLEMS),
    submissions: INITIAL_SUBMISSIONS,
    activities: INITIAL_ACTIVITIES,
    problems: PROBLEMS,
    freezeMode: false,
    frozenLeaderboard: null,
    contestStatus: 'Live' as const,
    timeRemaining: 5400,
    totalContestMinutes: 90,
    rejudgeHistory: [],
    sandboxSimulation: null,
    rewindMinute: null,
    plagiarismFlags: [],
    latestFirstBlood: null,
    
    isAdminAuthenticated: false,
    adminAuthModalOpen: false,
    pendingAdminAction: null,
  };
};

interface SavableState {
  participants: Participant[];
  submissions: Submission[];
  activities: ContestActivity[];
  problems: Problem[];
  freezeMode: boolean;
  frozenLeaderboard: Participant[] | null;
  contestStatus: 'Upcoming' | 'Live' | 'Ended';
  timeRemaining: number;
  totalContestMinutes: number;
  rejudgeHistory: RejudgeHistory[];
  plagiarismFlags: PlagiarismFlag[];
}

const saveStateToLocalStorage = (state: SavableState) => {
  if (typeof window !== 'undefined') {
    const stateToSave = {
      participants: state.participants,
      submissions: state.submissions,
      activities: state.activities,
      problems: state.problems,
      freezeMode: state.freezeMode,
      frozenLeaderboard: state.frozenLeaderboard,
      contestStatus: state.contestStatus,
      timeRemaining: state.timeRemaining,
      totalContestMinutes: state.totalContestMinutes,
      rejudgeHistory: state.rejudgeHistory,
      plagiarismFlags: state.plagiarismFlags || [],
    };
    localStorage.setItem('contest_control_center_state', JSON.stringify(stateToSave));
  }
};

export const useContestStore = create<ContestState>((set) => {
  const initialState = getInitialState();

  return {
    ...initialState,

    addSubmission: (sub) => {
      const id = sub.id || `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newSubmission: Submission = {
        ...sub,
        id,
        codeChecksum: sub.codeChecksum || `checksum_sub_${Math.random().toString(36).substring(2, 10)}`,
      };

      set((state) => {
        const updatedSubmissions = [newSubmission, ...state.submissions];
        const updatedParticipants = calculateStandings(state.participants, updatedSubmissions, state.problems);
        
        const isHardProblem = sub.problemCode === 'E' || sub.problemCode === 'F';
        const isFinalMinutes = state.timeRemaining < 600;
        const prefix = (isHardProblem && isFinalMinutes) ? '[SNIPER MODE] ' : '';

        const actId = `act_${Date.now()}`;
        const newActivity: ContestActivity = {
          id: actId,
          type: 'SUBMIT',
          description: `${prefix}Submission received: ${sub.participantName} submitted Problem ${sub.problemCode} (${sub.verdict})`,
          timestamp: Date.now(),
          contestMinutes: Math.floor((5400 - state.timeRemaining) / 60)
        };

        const updatedState = {
          submissions: updatedSubmissions,
          participants: updatedParticipants,
          activities: [newActivity, ...state.activities].slice(0, 100),
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });

      return id;
    },

    resolveSubmission: (id, verdict, executionTime) => {
      set((state) => {
        const updatedSubmissions = state.submissions.map((s) => 
          s.id === id ? { ...s, verdict, executionTime } : s
        );
        const updatedParticipants = calculateStandings(state.participants, updatedSubmissions, state.problems);
        
        const solvedSub = updatedSubmissions.find((s) => s.id === id);
        const activities = [...state.activities];
        let latestFirstBlood = state.latestFirstBlood;

        const isHardProblem = solvedSub ? (solvedSub.problemCode === 'E' || solvedSub.problemCode === 'F') : false;
        const isFinalMinutes = state.timeRemaining < 600;
        const prefix = (isHardProblem && isFinalMinutes) ? '[SNIPER MODE] ' : '';

        if (solvedSub && verdict === 'Accepted') {
          // Check if this is "First Blood" for this problem
          const otherAc = state.submissions.some((s) => 
            s.id !== id && s.problemCode === solvedSub.problemCode && s.verdict === 'Accepted'
          );
          if (!otherAc) {
            latestFirstBlood = {
              participantName: solvedSub.participantName,
              problemCode: solvedSub.problemCode
            };
            activities.unshift({
              id: `act_fb_${Date.now()}`,
              type: 'SUBMIT',
              description: `${prefix}FIRST BLOOD: ${solvedSub.participantName} solved Problem ${solvedSub.problemCode} (${solvedSub.problemName}) first!`,
              timestamp: Date.now(),
              contestMinutes: Math.floor((5400 - state.timeRemaining) / 60)
            });
          } else {
            activities.unshift({
              id: `act_${Date.now()}`,
              type: 'SUBMIT',
              description: `${prefix}Accepted solve: ${solvedSub.participantName} solved Problem ${solvedSub.problemCode} (${solvedSub.problemName})!`,
              timestamp: Date.now(),
              contestMinutes: Math.floor((5400 - state.timeRemaining) / 60)
            });
          }
        }

        // Plagiarism Detection
        let newPlagiarismFlags = [...state.plagiarismFlags];
        if (solvedSub && verdict !== 'Pending' && verdict !== 'Running' && solvedSub.codeChecksum) {
          const match = updatedSubmissions.find((s) => 
            s.id !== id &&
            s.problemCode === solvedSub.problemCode &&
            s.codeChecksum === solvedSub.codeChecksum &&
            s.verdict === verdict &&
            s.participantName !== solvedSub.participantName
          );

          if (match) {
            const alreadyFlagged = newPlagiarismFlags.some((f) => 
              (f.submissionIdA === id && f.submissionIdB === match.id) ||
              (f.submissionIdA === match.id && f.submissionIdB === id)
            );

            if (!alreadyFlagged) {
              const flagId = `flag_${Date.now()}`;
              newPlagiarismFlags.push({
                id: flagId,
                participantA: solvedSub.participantName,
                participantB: match.participantName,
                problemCode: solvedSub.problemCode,
                submissionIdA: id,
                submissionIdB: match.id,
                status: 'Pending',
                timestamp: Date.now()
              });

              activities.unshift({
                id: `act_flag_${Date.now()}`,
                type: 'REJUDGE',
                description: `SECURITY SCANNER: Anomaly detected between ${solvedSub.participantName} and ${match.participantName} on Problem ${solvedSub.problemCode}!`,
                timestamp: Date.now(),
                contestMinutes: Math.floor((5400 - state.timeRemaining) / 60)
              });
            }
          }
        }

        const updatedState = {
          submissions: updatedSubmissions,
          participants: updatedParticipants,
          activities: activities.slice(0, 100),
          latestFirstBlood,
          plagiarismFlags: newPlagiarismFlags
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    rejudgeSubmission: (id, newVerdict) => {
      set((state) => {
        if (!state.isAdminAuthenticated) return {};
        const subIndex = state.submissions.findIndex((s) => s.id === id);
        if (subIndex === -1) return {};

        const oldSub = state.submissions[subIndex];
        const previousVerdict = oldSub.verdict;
        const previousExecutionTime = oldSub.executionTime;

        const historyEntry: RejudgeHistory = {
          submissionId: id,
          previousVerdict,
          previousExecutionTime,
        };

        const updatedSubmissions = state.submissions.map((s) => 
          s.id === id 
            ? { ...s, verdict: newVerdict, executionTime: newVerdict === 'Accepted' ? 0.05 : s.executionTime } 
            : s
        );

        const updatedParticipants = calculateStandings(state.participants, updatedSubmissions, state.problems);
        
        const actId = `act_${Date.now()}`;
        const newActivity: ContestActivity = {
          id: actId,
          type: 'REJUDGE',
          description: `[ADMIN] Admin rejudged submission #${id.substring(4, 8) || id} for ${oldSub.participantName}: ${previousVerdict} -> ${newVerdict}`,
          timestamp: Date.now(),
        };

        const updatedState = {
          submissions: updatedSubmissions,
          participants: updatedParticipants,
          rejudgeHistory: [historyEntry, ...state.rejudgeHistory],
          activities: [newActivity, ...state.activities].slice(0, 100),
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    undoLastRejudge: () => {
      set((state) => {
        if (state.rejudgeHistory.length === 0) return {};

        const [last, ...remainingHistory] = state.rejudgeHistory;
        const sub = state.submissions.find((s) => s.id === last.submissionId);
        if (!sub) return {};

        const updatedSubmissions = state.submissions.map((s) => 
          s.id === last.submissionId 
            ? { ...s, verdict: last.previousVerdict, executionTime: last.previousExecutionTime } 
            : s
        );

        const updatedParticipants = calculateStandings(state.participants, updatedSubmissions, state.problems);
        
        const actId = `act_${Date.now()}`;
        const newActivity: ContestActivity = {
          id: actId,
          type: 'REJUDGE',
          description: `[UNDO] Undone rejudge on submission #${last.submissionId.substring(4, 8) || last.submissionId} for ${sub.participantName}`,
          timestamp: Date.now(),
        };

        const updatedState = {
          submissions: updatedSubmissions,
          participants: updatedParticipants,
          rejudgeHistory: remainingHistory,
          activities: [newActivity, ...state.activities].slice(0, 100),
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    toggleFreezeMode: () => {
      set((state) => {
        const nextFreezeMode = !state.freezeMode;
        let frozenLeaderboard = null;

        if (nextFreezeMode) {
          frozenLeaderboard = JSON.parse(JSON.stringify(state.participants));
        }

        const actId = `act_${Date.now()}`;
        const newActivity: ContestActivity = {
          id: actId,
          type: nextFreezeMode ? 'FREEZE' : 'UNFREEZE',
          description: nextFreezeMode 
            ? '[FREEZE] Contest Leaderboard enters FREEZE MODE! Standings locked.' 
            : '[UNFREEZE] Contest Leaderboard UNFROZEN! Standings recalculated.',
          timestamp: Date.now(),
        };

        const finalParticipants = nextFreezeMode 
          ? state.participants 
          : calculateStandings(state.participants, state.submissions, state.problems);

        const updatedState = {
          freezeMode: nextFreezeMode,
          frozenLeaderboard,
          participants: finalParticipants,
          activities: [newActivity, ...state.activities].slice(0, 100),
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    setContestStatus: (status) => {
      set((state) => {
        const updatedState = { contestStatus: status };
        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    tickTime: (amount) => {
      set((state) => {
        if (state.contestStatus !== 'Live') return {};
        
        const newTime = Math.max(0, state.timeRemaining - amount);
        const status: 'Upcoming' | 'Live' | 'Ended' = newTime === 0 ? 'Ended' : state.contestStatus;

        const updatedState = {
          timeRemaining: newTime,
          contestStatus: status,
        };

        if (newTime === 0 && state.timeRemaining > 0) {
          const endActivity: ContestActivity = {
            id: `act_end_${Date.now()}`,
            type: 'UNFREEZE',
            description: '[END] The contest has officially ended! final rankings are locked.',
            timestamp: Date.now(),
          };
          
          const finalState = {
            ...updatedState,
            activities: [endActivity, ...state.activities].slice(0, 100),
          };
          saveStateToLocalStorage({ ...state, ...finalState });
          return finalState;
        }

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    addActivity: (type, description) => {
      set((state) => {
        const newActivity: ContestActivity = {
          id: `act_${Date.now()}`,
          type,
          description,
          timestamp: Date.now(),
        };
        const updatedState = {
          activities: [newActivity, ...state.activities].slice(0, 100),
        };
        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    resetContest: () => {
      set((state) => {
        if (!state.isAdminAuthenticated) return {};
        if (typeof window !== 'undefined') {
          localStorage.removeItem('contest_control_center_state');
        }
        return {
          participants: calculateStandings(INITIAL_PARTICIPANTS, INITIAL_SUBMISSIONS, PROBLEMS),
          submissions: INITIAL_SUBMISSIONS,
          activities: INITIAL_ACTIVITIES,
          problems: PROBLEMS,
          freezeMode: false,
          frozenLeaderboard: null,
          contestStatus: 'Live',
          timeRemaining: 5400,
          totalContestMinutes: 90,
          rejudgeHistory: [],
          sandboxSimulation: null,
          rewindMinute: null,
          plagiarismFlags: [],
          latestFirstBlood: null,
        };
      });
    },

    addParticipant: (name, institution) => {
      set((state) => {
        const exists = state.participants.some((p) => p.name.toLowerCase() === name.toLowerCase());
        if (exists) return {};

        const newParticipant: Participant = {
          name,
          institution,
          solvedProblems: [],
          problemAttempts: {},
          penaltyTime: 0,
          solvedCount: 0,
          rank: state.participants.length + 1,
          status: 'Active',
        };

        const updatedParticipants = [...state.participants, newParticipant];
        const finalParticipants = calculateStandings(updatedParticipants, state.submissions, state.problems);

        const actId = `act_${Date.now()}`;
        const newActivity: ContestActivity = {
          id: actId,
          type: 'JOIN',
          description: `New participant joined: ${name} (${institution})`,
          timestamp: Date.now(),
        };

        const updatedState = {
          participants: finalParticipants,
          activities: [newActivity, ...state.activities].slice(0, 100),
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    setContestTime: (minutes) => {
      set((state) => {
        const timeRemaining = minutes * 60;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const timeStr = `${h > 0 ? `${h}h ` : ''}${m}m`;

        const actId = `act_${Date.now()}`;
        const newActivity: ContestActivity = {
          id: actId,
          type: 'REJUDGE',
          description: `Contest time adjusted to ${timeStr} remaining by Admin`,
          timestamp: Date.now(),
        };

        const updatedState = {
          timeRemaining,
          totalContestMinutes: minutes,   // Keep full duration in sync with admin input
          activities: [newActivity, ...state.activities].slice(0, 100),
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    setSandboxSimulation: (simulation) => {
      set({ sandboxSimulation: simulation });
    },

    setRewindMinute: (minute) => {
      set({ rewindMinute: minute });
    },

    resolvePlagiarismFlag: (id, status) => {
      set((state) => {
        if (!state.isAdminAuthenticated) return {};
        const updatedFlags = state.plagiarismFlags.map((f) => 
          f.id === id ? { ...f, status } : f
        );
        const flag = state.plagiarismFlags.find((f) => f.id === id);
        
        let participants = [...state.participants];
        const activities = [...state.activities];

        if (flag) {
          if (status === 'Investigated') {
            // Disqualify both participants
            participants = state.participants.map((p) => 
              p.name === flag.participantA || p.name === flag.participantB
                ? { ...p, status: 'Disqualified' as const }
                : p
            );
            
            activities.unshift({
              id: `act_dq_${Date.now()}`,
              type: 'REJUDGE',
              description: `SECURITY DECISION: ${flag.participantA} and ${flag.participantB} disqualified due to confirmed plagiarism!`,
              timestamp: Date.now()
            });
          } else if (status === 'Cleared') {
            // Re-activate both if not flagged elsewhere
            // We only activate if they aren't part of another investigated plagiarism flag
            const remainsDq = (name: string) => updatedFlags.some((f) => 
              f.status === 'Investigated' && (f.participantA === name || f.participantB === name)
            );

            participants = state.participants.map((p) => 
              (p.name === flag.participantA || p.name === flag.participantB) && !remainsDq(p.name)
                ? { ...p, status: 'Active' as const }
                : p
            );

            activities.unshift({
              id: `act_clear_${Date.now()}`,
              type: 'REJUDGE',
              description: `SECURITY DECISION: Plagiarism case cleared for ${flag.participantA} and ${flag.participantB}.`,
              timestamp: Date.now()
            });
          }
        }

        const updatedParticipants = calculateStandings(participants, state.submissions, state.problems);

        const updatedState = {
          plagiarismFlags: updatedFlags,
          participants: updatedParticipants,
          activities: activities.slice(0, 100)
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    clearLatestFirstBlood: () => {
      set({ latestFirstBlood: null });
    },

    disqualifyParticipant: (name) => {
      set((state) => {
        if (!state.isAdminAuthenticated) return {};
        const participants = state.participants.map((p) => 
          p.name === name ? { ...p, status: 'Disqualified' as const } : p
        );
        const updatedParticipants = calculateStandings(participants, state.submissions, state.problems);
        
        const activities = [...state.activities];
        activities.unshift({
          id: `act_dq_manual_${Date.now()}`,
          type: 'REJUDGE',
          description: `SECURITY SCANNER: ${name} manually disqualified by Admin.`,
          timestamp: Date.now()
        });

        const updatedState = {
          participants: updatedParticipants,
          activities: activities.slice(0, 100)
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    clearParticipantStatus: (name) => {
      set((state) => {
        if (!state.isAdminAuthenticated) return {};
        const participants = state.participants.map((p) => 
          p.name === name ? { ...p, status: 'Active' as const } : p
        );
        const updatedParticipants = calculateStandings(participants, state.submissions, state.problems);
        
        const activities = [...state.activities];
        activities.unshift({
          id: `act_active_manual_${Date.now()}`,
          type: 'REJUDGE',
          description: `SECURITY SCANNER: ${name} restored to Active status by Admin.`,
          timestamp: Date.now()
        });

        const updatedState = {
          participants: updatedParticipants,
          activities: activities.slice(0, 100)
        };

        saveStateToLocalStorage({ ...state, ...updatedState });
        return updatedState;
      });
    },

    setAdminAuthenticated: (auth) => set({ isAdminAuthenticated: auth }),
    setAdminAuthModalOpen: (open) => set({ adminAuthModalOpen: open }),
    setPendingAdminAction: (action) => set(() => ({ pendingAdminAction: action })),
  };
});
