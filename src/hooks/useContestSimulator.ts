import { useEffect, useRef } from 'react';
import { useContestStore } from '../store/useContestStore';
import { PROBLEMS, Submission } from '../utils/mockData';

const NEW_PARTICIPANTS_POOL = [
  { name: 'John Doe', institution: 'Harvard University' },
  { name: 'Sakura Haruno', institution: 'Kyoto University' },
  { name: 'Vikram Singh', institution: 'IIT Delhi' },
  { name: 'Maria Gomez', institution: 'University of Madrid' },
  { name: 'Jean Dupont', institution: 'Sorbonne University' },
  { name: 'Chen Lu', institution: 'Peking University' },
  { name: 'Alex Johnson', institution: 'Caltech' },
  { name: 'Zahra Al-Farsi', institution: 'KAUST' },
];

export const useContestSimulator = () => {
  const { 
    contestStatus, 
    addSubmission, 
    resolveSubmission, 
    addParticipant, 
    participants, 
    timeRemaining, 
    tickTime 
  } = useContestStore();

  const simulatorActiveRef = useRef(false);

  useEffect(() => {
    if (contestStatus !== 'Live') return;

    const timer = setInterval(() => {
      tickTime(1);
    }, 1000);

    return () => clearInterval(timer);
  }, [contestStatus, tickTime]);

  useEffect(() => {
    if (contestStatus !== 'Live') {
      simulatorActiveRef.current = false;
      return;
    }

    simulatorActiveRef.current = true;

    const triggerRandomSubmission = () => {
      if (!simulatorActiveRef.current || contestStatus !== 'Live') return;

      const activeParticipants = participants.filter(p => p.status === 'Active');
      if (activeParticipants.length === 0) return;

      const isPlagiarismAnomaly = Math.random() < 0.08 && activeParticipants.length >= 2;
      const participantsToSubmit = [];

      if (isPlagiarismAnomaly) {
        const idxA = Math.floor(Math.random() * activeParticipants.length);
        let idxB = Math.floor(Math.random() * activeParticipants.length);
        while (idxB === idxA) {
          idxB = Math.floor(Math.random() * activeParticipants.length);
        }
        participantsToSubmit.push(activeParticipants[idxA], activeParticipants[idxB]);
      } else {
        const participant = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
        participantsToSubmit.push(participant);
      }

      const problem = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
      const languages: Submission['language'][] = ['C++', 'Java', 'Python', 'Go'];
      const language = languages[Math.floor(Math.random() * languages.length)];
      const minutesElapsed = Math.floor((5400 - timeRemaining) / 60);

      // Shared execution details for plagiarism duplicate
      const roll = Math.random();
      let verdict: Submission['verdict'] = 'Wrong Answer';
      let acChance = 0.5;
      if (problem.code === 'A') acChance = 0.80;
      else if (problem.code === 'B') acChance = 0.65;
      else if (problem.code === 'C') acChance = 0.50;
      else if (problem.code === 'D') acChance = 0.35;
      else if (problem.code === 'E') acChance = 0.20;
      else if (problem.code === 'F') acChance = 0.15;

      if (roll < acChance) {
        verdict = 'Accepted';
      } else if (roll < acChance + (1 - acChance) * 0.55) {
        verdict = 'Wrong Answer';
      } else if (roll < acChance + (1 - acChance) * 0.80) {
        verdict = 'Time Limit Exceeded';
      } else {
        verdict = 'Runtime Error';
      }

      const executionTime = verdict === 'Accepted' 
        ? parseFloat((Math.random() * 0.2 + 0.01).toFixed(2))
        : verdict === 'Time Limit Exceeded' 
          ? parseFloat((2.0 + Math.random()).toFixed(2))
          : parseFloat((Math.random() * 0.5).toFixed(2));

      const sharedChecksum = `checksum_sim_${Math.random().toString(36).substring(2, 10)}`;

      // Now create and schedule resolve for each participant
      participantsToSubmit.forEach((p, idx) => {
        setTimeout(() => {
          if (!simulatorActiveRef.current || contestStatus !== 'Live') return;

          const subId = addSubmission({
            participantName: p.name,
            problemCode: problem.code,
            problemName: problem.title,
            timestamp: minutesElapsed,
            verdict: 'Pending',
            language,
            executionTime: 0,
            codeChecksum: isPlagiarismAnomaly ? sharedChecksum : `checksum_sim_${Math.random().toString(36).substring(2, 10)}`,
          });

          setTimeout(() => {
            if (!simulatorActiveRef.current) return;
            resolveSubmission(subId, 'Running', 0);

            setTimeout(() => {
              if (!simulatorActiveRef.current) return;
              resolveSubmission(subId, verdict, executionTime);
            }, 1200);

          }, 800);

        }, idx * 150); // Stagger adding to queue but keep matching elapsed timestamps
      });
    };

    const triggerNewParticipant = () => {
      if (!simulatorActiveRef.current || contestStatus !== 'Live') return;

      const currentNames = new Set(participants.map(p => p.name.toLowerCase()));
      const available = NEW_PARTICIPANTS_POOL.filter(p => !currentNames.has(p.name.toLowerCase()));

      if (available.length > 0) {
        const newPart = available[Math.floor(Math.random() * available.length)];
        addParticipant(newPart.name, newPart.institution);
      }
    };

    let submissionTimer: NodeJS.Timeout;
    const scheduleNextSubmission = () => {
      const delay = Math.floor(Math.random() * 7000) + 5000;
      submissionTimer = setTimeout(() => {
        triggerRandomSubmission();
        scheduleNextSubmission();
      }, delay);
    };

    let participantTimer: NodeJS.Timeout;
    const scheduleNextParticipant = () => {
      const delay = Math.floor(Math.random() * 30000) + 45000;
      participantTimer = setTimeout(() => {
        triggerNewParticipant();
        scheduleNextParticipant();
      }, delay);
    };

    scheduleNextSubmission();
    scheduleNextParticipant();

    const initialTimer = setTimeout(() => {
      triggerRandomSubmission();
    }, 2000);

    return () => {
      simulatorActiveRef.current = false;
      clearTimeout(submissionTimer);
      clearTimeout(participantTimer);
      clearTimeout(initialTimer);
    };
  }, [contestStatus, participants, timeRemaining, addSubmission, resolveSubmission, addParticipant]);
};
