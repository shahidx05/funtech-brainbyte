import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import RegistrationCard from './components/RegistrationCard.jsx';
import RulesModal from './components/RulesModal.jsx';
import QuizHeader from './components/QuizHeader.jsx';
import QuestionNav from './components/QuestionNav.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import WarningModal from './components/WarningModal.jsx';
import LockoutModal from './components/LockoutModal.jsx';
import ResultCard from './components/ResultCard.jsx';
import SecurityWatermark from './components/SecurityWatermark.jsx';
import AdminLogin from './components/Admin/AdminLogin.jsx';
import AdminDashboard from './components/Admin/AdminDashboard.jsx';
import { useAntiCheat } from './hooks/useAntiCheat.js';
import { ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

import WaitingRoom from './components/WaitingRoom.jsx';

export default function App() {
  // Application Stage: 'REGISTER' | 'RULES' | 'WAIT_LIVE' | 'QUIZ' | 'LOCKOUT' | 'RESULT' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD'
  const [stage, setStage] = useState('REGISTER');
  const [previousStage, setPreviousStage] = useState('REGISTER');
  const [adminSecret, setAdminSecret] = useState('');

  
  const [participant, setParticipant] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(1800);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [answersMap, setAnswersMap] = useState({});
  const [reviewedSet, setReviewedSet] = useState(new Set());
  const [startTime, setStartTime] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState(null);

  // Check saved session in localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('funtech_quiz_token');
    const savedParticipant = localStorage.getItem('funtech_quiz_participant');

    if (savedToken && savedParticipant) {
      try {
        const parsed = JSON.parse(savedParticipant);
        setJwtToken(savedToken);
        setParticipant(parsed);

        if (parsed.isBlocked || localStorage.getItem('funtech_quiz_is_blocked') === 'true') {
          setStage('LOCKOUT');
          return;
        }

        // Check if answers saved locally
        const savedAnswers = localStorage.getItem('funtech_quiz_answers');
        if (savedAnswers) {
          setAnswersMap(JSON.parse(savedAnswers));
        }
        // Auto-resume past registration if session exists
        setStage('RULES');
      } catch (e) {}
    }
  }, []);

  // Auto-check live status periodically if waiting in room
  useEffect(() => {
    if (stage !== 'WAIT_LIVE') return;
    const interval = setInterval(() => {
      startQuizSession();
    }, 5000);
    return () => clearInterval(interval);
  }, [stage, jwtToken]);

  // Submit Handler Callback for Anti-Cheat Lockout
  const handleLockoutSubmit = useCallback(async (finalTabSwitches) => {
    localStorage.setItem('funtech_quiz_is_blocked', 'true');
    setStage('LOCKOUT');
    try {
      if (jwtToken) {
        await axios.post(
          '/api/quiz/block-self',
          { reason: `Exceeded security violation limit (${finalTabSwitches} tab switches)` },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
      }
    } catch (e) {}
    await submitAnswers(true);
  }, [jwtToken]);

  // Anti-Cheat Hook initialization
  const isAntiCheatActive = stage === 'QUIZ';
  const antiCheat = useAntiCheat({
    active: isAntiCheatActive,
    maxTabSwitches: 4,
    onViolationThresholdReached: (finalCount) => {
      handleLockoutSubmit(finalCount);
    },
  });

  // Handle Registration Success
  const handleRegisterSuccess = (newParticipant, token) => {
    setParticipant(newParticipant);
    setJwtToken(token);
    
    // Clear any previous session's quiz data to prevent cross-contamination
    setAnswersMap({});
    localStorage.removeItem('funtech_quiz_answers');
    localStorage.removeItem('funtech_quiz_start_time');
    localStorage.removeItem('funtech_quiz_is_blocked');

    localStorage.setItem('funtech_quiz_token', token);
    localStorage.setItem('funtech_quiz_participant', JSON.stringify(newParticipant));

    if (newParticipant.isBlocked) {
      localStorage.setItem('funtech_quiz_is_blocked', 'true');
      setStage('LOCKOUT');
    } else {
      setStage('RULES');
    }
  };

  // Fetch Quiz Questions
  const startQuizSession = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.get('/api/quiz', {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (res.data && res.data.success) {
        // Participant is clear and unblocked: reset anti-cheat counter from 0 to 4
        localStorage.removeItem('funtech_quiz_is_blocked');
        antiCheat.resetViolations();

        const { questions: fetchedQuestions, timeLimitSeconds: limit } = res.data.data;
        setQuestions(fetchedQuestions || []);
        setTimeLimitSeconds(limit || 1800);
        
        let sessionStartTime = Date.now();
        const savedStartTime = localStorage.getItem('funtech_quiz_start_time');
        if (savedStartTime) {
          sessionStartTime = parseInt(savedStartTime, 10);
        } else {
          localStorage.setItem('funtech_quiz_start_time', sessionStartTime.toString());
        }
        
        setStartTime(sessionStartTime);
        setStage('QUIZ');
        antiCheat.enterFullscreen();
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Participant was wiped by admin: clear local storage & return to registration
        localStorage.clear();
        setParticipant(null);
        setJwtToken('');
        setStage('REGISTER');
      } else if (err.response && err.response.data && err.response.data.isBlocked) {
        localStorage.setItem('funtech_quiz_is_blocked', 'true');
        setStage('LOCKOUT');
      } else if (err.response && err.response.data && err.response.data.isNotLive) {
        setStage('WAIT_LIVE');
      } else if (err.response && err.response.status === 403) {
        setErrorMsg('You have already submitted this quiz attempt.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Failed to load quiz. Please verify backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Option Selection
  const handleSelectOption = (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newMap = { ...answersMap };
    if (optionKey === null) {
      delete newMap[currentQ._id];
    } else {
      newMap[currentQ._id] = optionKey;
    }
    setAnswersMap(newMap);
    localStorage.setItem('funtech_quiz_answers', JSON.stringify(newMap));
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newSet = new Set(reviewedSet);
    if (newSet.has(currentQ._id)) {
      newSet.delete(currentQ._id);
    } else {
      newSet.add(currentQ._id);
    }
    setReviewedSet(newSet);
  };

  // Submit Quiz Answers
  const submitAnswers = async (isAutoSubmit = false) => {
    setLoading(true);
    setErrorMsg('');

    const formattedAnswers = Object.entries(answersMap).map(([qId, optKey]) => ({
      questionId: qId,
      selectedOptionKey: optKey,
    }));

    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    try {
      const res = await axios.post(
        '/api/quiz/submit',
        {
          answers: formattedAnswers,
          timeTakenSeconds: timeTaken,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (res.data && res.data.success) {
        setResultData(res.data.data);
        antiCheat.exitFullscreen();
        
        // Clear local storage after successful submission so another user starts fresh
        localStorage.removeItem('funtech_quiz_answers');
        localStorage.removeItem('funtech_quiz_token');
        localStorage.removeItem('funtech_quiz_participant');
        localStorage.removeItem('funtech_quiz_start_time');

        if (!isAutoSubmit) {
          setStage('RESULT');
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setErrorMsg('You have already submitted this quiz.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Submission error. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative transition-all ${antiCheat.securityShieldActive ? 'blur-security-shield' : ''}`}>
      
      {/* Dynamic Watermark overlay */}
      <SecurityWatermark participant={participant} />

      {/* Screenshot Flash Alert */}
      {antiCheat.screenshotDetectedAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-300 text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span>Screenshot Attempt Detected & Blocked! Screen Obscured.</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        participant={participant}
        stage={stage}
        onToggleAdmin={() => {
          if (stage === 'ADMIN_DASHBOARD' || stage === 'ADMIN_LOGIN') {
            setStage(previousStage);
          } else {
            setPreviousStage(stage);
            setStage(adminSecret ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN');
          }
        }}
      />

      {/* Main Content Stage View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-center">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <p className="font-heading text-sm font-semibold text-slate-200">Processing Request...</p>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && stage !== 'REGISTER' && stage !== 'ADMIN_LOGIN' && (
          <div className="max-w-xl mx-auto mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-start space-x-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Notice</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Admin Login Stage */}
        {stage === 'ADMIN_LOGIN' && (
          <AdminLogin
            onLoginSuccess={(secret) => {
              setAdminSecret(secret);
              setStage('ADMIN_DASHBOARD');
            }}
            onCancel={() => setStage(previousStage)}
          />
        )}

        {/* Admin Dashboard Stage */}
        {stage === 'ADMIN_DASHBOARD' && (
          <AdminDashboard
            adminSecret={adminSecret}
            onLogout={() => {
              setAdminSecret('');
              setStage(previousStage);
            }}
          />
        )}

        {/* 1. Registration View */}
        {stage === 'REGISTER' && (
          <RegistrationCard onRegisterSuccess={handleRegisterSuccess} />
        )}

        {/* 2. Rules & Security Modal */}
        {stage === 'RULES' && (
          <RulesModal
            participant={participant}
            onAcceptRules={startQuizSession}
            onCancel={() => {
              localStorage.clear();
              setStage('REGISTER');
            }}
          />
        )}

        {/* 2.5 Waiting Room Screen (Quiz Not Live Yet) */}
        {stage === 'WAIT_LIVE' && (
          <WaitingRoom
            participant={participant}
            onCheckLive={startQuizSession}
            checking={loading}
          />
        )}

        {/* 3. Active Quiz Workspace View */}
        {stage === 'QUIZ' && questions.length > 0 && (
          <div className="space-y-6">
            
            {/* Live Subheader */}
            <QuizHeader
              totalQuestions={questions.length}
              answeredCount={Object.keys(answersMap).length}
              timeLimitSeconds={timeLimitSeconds}
              tabSwitchCount={antiCheat.tabSwitchCount}
              maxTabSwitches={antiCheat.maxTabSwitches}
              onSubmitClick={() => submitAnswers(false)}
            />

            {/* Quiz Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Question Card */}
              <div className="lg:col-span-2">
                <QuestionCard
                  question={questions[currentIndex]}
                  currentIndex={currentIndex}
                  totalQuestions={questions.length}
                  selectedOptionKey={answersMap[questions[currentIndex]?._id]}
                  onSelectOption={handleSelectOption}
                  onNext={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                  onPrev={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  isReviewed={reviewedSet.has(questions[currentIndex]?._id)}
                  onToggleReview={handleToggleReview}
                />
              </div>

              {/* Right Column: Question Navigation Matrix */}
              <div className="lg:col-span-1">
                <QuestionNav
                  questions={questions}
                  currentIndex={currentIndex}
                  onSelectQuestion={(idx) => setCurrentIndex(idx)}
                  answersMap={answersMap}
                  reviewedSet={reviewedSet}
                />
              </div>

            </div>

            {/* Tab Switch Warning Modal Popup */}
            {antiCheat.showWarningModal && !antiCheat.isBlocked && (
              <WarningModal
                tabSwitchCount={antiCheat.tabSwitchCount}
                maxTabSwitches={antiCheat.maxTabSwitches}
                onDismiss={antiCheat.dismissWarningModal}
              />
            )}

          </div>
        )}

        {/* 4. Session Lockout Screen */}
        {stage === 'LOCKOUT' && (
          <LockoutModal
            tabSwitchCount={antiCheat.tabSwitchCount}
            onAdminClick={() => setStage(adminSecret ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')}
          />
        )}

        {/* 5. Result Summary Screen */}
        {stage === 'RESULT' && resultData && (
          <ResultCard
            resultData={resultData}
            participant={participant}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800/60 text-center text-xs text-slate-500">
        <p>© 2026 FunTech Club MITS. All Rights Reserved. Built for BrainByte Quiz Event.</p>
      </footer>
    </div>
  );
}
