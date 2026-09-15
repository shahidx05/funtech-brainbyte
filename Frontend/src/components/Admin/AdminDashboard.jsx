import React, { useState, useEffect } from 'react';
import { Trophy, Users, HelpCircle, Plus, Edit2, Trash2, RefreshCw, Shield, Search, Award, CheckCircle, Clock, Lock } from 'lucide-react';
import axios from 'axios';
import QuestionModal from './QuestionModal.jsx';

export default function AdminDashboard({ adminSecret, onLogout }) {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'participants' | 'questions'
  
  const [results, setResults] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ totalRegistered: 0, totalSubmitted: 0, totalPending: 0 });
  const [questions, setQuestions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);

  const headers = { 'x-admin-secret': adminSecret };

  const [isLive, setIsLive] = useState(false);
  const [togglingLive, setTogglingLive] = useState(false);

  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [maxRequestsPerIp, setMaxRequestsPerIp] = useState(500);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchQuizSettings = async () => {
    try {
      const res = await axios.get('/admin/quiz-settings', { headers });
      if (res.data && res.data.success) {
        const s = res.data.data.settings;
        setIsLive(s.isLive);
        setRateLimitEnabled(s.rateLimitEnabled ?? false);
        setMaxRequestsPerIp(s.maxRequestsPerIp ?? 500);
      }
    } catch (e) {}
  };

  const handleToggleLive = async () => {
    setTogglingLive(true);
    try {
      const res = await axios.put('/admin/quiz-toggle-live', { isLive: !isLive }, { headers });
      if (res.data && res.data.success) {
        setIsLive(res.data.data.settings.isLive);
      }
    } catch (err) {
      console.error('Failed to toggle live status');
    } finally {
      setTogglingLive(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await axios.put(
        '/admin/quiz-settings',
        { rateLimitEnabled, maxRequestsPerIp: Number(maxRequestsPerIp) },
        { headers }
      );
      if (res.data && res.data.success) {
        alert('Rate limit settings saved successfully!');
      }
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch Data based on active tab
  const fetchData = async () => {
    setLoading(true);
    fetchQuizSettings();
    try {
      if (activeTab === 'leaderboard') {
        const res = await axios.get('/admin/results', { headers });
        if (res.data && res.data.success) {
          setResults(res.data.data.results || []);
        }
      } else if (activeTab === 'participants') {
        const res = await axios.get('/admin/participants', { headers });
        if (res.data && res.data.success) {
          setParticipants(res.data.data.participants || []);
          setStats(res.data.data.stats || {});
        }
      } else if (activeTab === 'questions') {
        const res = await axios.get('/admin/questions', { headers });
        if (res.data && res.data.success) {
          setQuestions(res.data.data.questions || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeleteQuestion = async (id) => {
    try {
      await axios.delete(`/admin/questions/${id}`, { headers });
      fetchData();
    } catch (err) {
      console.error('Failed to delete question');
    }
  };

  const handleToggleBlockParticipant = async (id) => {
    try {
      await axios.put(`/admin/participants/${id}/toggle-block`, {}, { headers });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle block participant');
    }
  };

  const handleResetParticipantScore = async (id, name) => {
    try {
      await axios.put(`/admin/participants/${id}/reset`, {}, { headers });
      fetchData();
    } catch (err) {
      console.error('Failed to reset participant score');
    }
  };

  const handleDeleteParticipant = async (id, name) => {
    try {
      await axios.delete(`/admin/participants/${id}`, { headers });
      fetchData();
    } catch (err) {
      console.error('Failed to delete participant');
    }
  };

  const handleClearAllScores = async () => {
    try {
      await axios.post('/admin/reset-scores', {}, { headers });
      fetchData();
    } catch (err) {
      console.error('Failed to clear all scores');
    }
  };

  const handleDeleteAllParticipants = async () => {
    try {
      await axios.delete('/admin/participants', { headers });
      fetchData();
    } catch (err) {
      console.error('Failed to delete all participants');
    }
  };

  const filteredResults = results.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.rollNumber && r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-white">Society Admin Control Center</h2>
            <p className="text-xs text-slate-400">Live Management Portal for FunTech BrainByte '26</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quiz Live Switch */}
          <button
            onClick={handleToggleLive}
            disabled={togglingLive}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-2 cursor-pointer ${
              isLive
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-lg shadow-emerald-500/10'
                : 'bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 shadow-lg shadow-amber-500/10'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isLive ? 'QUIZ IS LIVE' : 'QUIZ IS NOT LIVE'}</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-950/60 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition cursor-pointer"
          >
            Lock Portal
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Live Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'participants'
              ? 'bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Participants Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Questions CRUD ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Rate Limit Settings</span>
        </button>
      </div>

      {/* Tab 1: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">{filteredResults.length} Submissions</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Participant</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Time Taken</th>
                  <th className="p-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredResults.map((r) => (
                  <tr key={r.email} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold">
                      {r.rank === 1 ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-400 border border-amber-500/40">🥇 1st</span>
                      ) : r.rank === 2 ? (
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-600">🥈 2nd</span>
                      ) : r.rank === 3 ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-950/40 text-amber-600 border border-amber-800">🥉 3rd</span>
                      ) : (
                        `#${r.rank}`
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-100">{r.name}</p>
                      <p className="text-[11px] text-slate-400">{r.email}</p>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{r.rollNumber || 'N/A'}</td>
                    <td className="p-4 font-mono font-bold text-cyan-400 text-sm">{r.score} pts</td>
                    <td className="p-4 font-mono text-slate-300">{r.timeTakenSeconds ? `${Math.floor(r.timeTakenSeconds / 60)}m ${r.timeTakenSeconds % 60}s` : 'N/A'}</td>
                    <td className="p-4 text-slate-400">{new Date(r.submittedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No submissions found yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Participants */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="grid grid-cols-4 gap-4 flex-1">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-400">Total Registered</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{stats.totalRegistered || participants.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-400">Submitted</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalSubmitted || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{stats.totalPending || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-400">Disqualified / Blocked</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{stats.totalBlocked || 0}</p>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearAllScores}
                className="px-3.5 py-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900/80 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                title="Reset scores and quiz attempts for all participants so they can retake"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All Scores</span>
              </button>
              <button
                onClick={handleDeleteAllParticipants}
                className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900/80 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                title="Wipe out all participants from roster"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe All Users</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">{filteredParticipants.length} Participants</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredParticipants.map((p) => (
                  <tr key={p._id || p.email} className={`hover:bg-slate-800/40 ${p.isBlocked ? 'bg-red-950/20' : ''}`}>
                    <td className="p-4 font-semibold text-slate-100">
                      {p.name}
                      {p.isBlocked && <span className="ml-2 text-[10px] text-red-400 font-normal">({p.blockedReason || 'Blocked'})</span>}
                    </td>
                    <td className="p-4 font-mono text-slate-400">{p.email}</td>
                    <td className="p-4 font-mono text-slate-400">{p.rollNumber || '-'}</td>
                    <td className="p-4">
                      {p.isBlocked ? (
                        <span className="px-2.5 py-1 rounded-md bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-bold">🚫 Disqualified</span>
                      ) : p.submitted ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">Completed ({p.score} pts)</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">In Progress</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">{new Date(p.registeredAt).toLocaleString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleBlockParticipant(p._id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                          p.isBlocked
                            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
                            : 'bg-red-950/60 border-red-500/30 text-red-300 hover:bg-red-900/60'
                        }`}
                      >
                        {p.isBlocked ? 'Unblock' : 'Disqualify'}
                      </button>
                      <button
                        onClick={() => handleResetParticipantScore(p._id, p.name)}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-900/60 text-[11px] font-semibold transition cursor-pointer"
                        title="Reset score and allow re-attempt"
                      >
                        Reset Score
                      </button>
                      <button
                        onClick={() => handleDeleteParticipant(p._id, p.name)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 text-[11px] font-semibold transition cursor-pointer"
                        title="Remove user from roster"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredParticipants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No participants registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Questions CRUD */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-slate-200">Question Pool Management</h3>
            <button
              onClick={() => {
                setQuestionToEdit(null);
                setIsQuestionModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl font-heading font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-300 hover:from-cyan-300 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add New Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q._id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold flex items-center justify-center">
                      Q{q.order || idx + 1}
                    </span>
                    <h4 className="font-semibold text-slate-100 text-sm">{q.questionText}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setQuestionToEdit(q);
                        setIsQuestionModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {q.options.map(opt => (
                    <div
                      key={opt.key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        opt.key === q.correctOptionKey
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span><strong>{opt.key}:</strong> {opt.text}</span>
                      {opt.key === q.correctOptionKey && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Rate Limit Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-100">IP Rate Limiting Controls</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Configure how network traffic and IP requests are handled during the quiz competition.
            </p>
          </div>

          <div className="space-y-6">
            {/* Toggle Enable/Disable */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="font-semibold text-xs text-slate-200">Enable IP Rate Limiting</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Disable this if multiple participants are sharing the same College WiFi or Lab IP address.
                </p>
              </div>
              <button
                onClick={() => setRateLimitEnabled(!rateLimitEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  rateLimitEnabled ? 'bg-purple-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    rateLimitEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Max Requests Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Max Requests Allowed Per IP (15-Minute Window)
              </label>
              <input
                type="number"
                min="10"
                max="10000"
                value={maxRequestsPerIp}
                onChange={(e) => setMaxRequestsPerIp(e.target.value)}
                disabled={!rateLimitEnabled}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 disabled:opacity-40"
              />
              <p className="text-[11px] text-slate-500">
                Recommended: 500–1000 for shared networks, 10–20 for strict anti-bot protection.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl font-heading font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-300 hover:from-cyan-300 transition cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Question Create/Edit Modal */}
      {isQuestionModalOpen && (
        <QuestionModal
          adminSecret={adminSecret}
          questionToEdit={questionToEdit}
          onClose={() => setIsQuestionModalOpen(false)}
          onSaveSuccess={() => {
            setIsQuestionModalOpen(false);
            fetchData();
          }}
        />
      )}

    </div>
  );
}
