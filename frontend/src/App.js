// src/App.js
import React, { useState } from 'react';
import Builder from './components/builder';
import './App.css';
import { getUserId } from './utils/userId';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: '', comment: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  const submitFeedback = async () => {
    if (!feedback.rating) return; // Require rating

    setFeedbackError('');
    setFeedbackStatus('');

    // Store locally
    try {
      const stored = JSON.parse(localStorage.getItem('feedback') || '[]');
      stored.push({ ...feedback, date: new Date().toISOString() });
      localStorage.setItem('feedback', JSON.stringify(stored));
    } catch (err) {
      console.error('Failed to store feedback:', err);
    }

    // Send to backend for feedback.log
    try {
      const userId = getUserId();
      const message =
        (feedback.rating || '') +
        (feedback.comment ? ' - ' + feedback.comment : '');

      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': userId || '',
        },
        body: JSON.stringify({
          message,
          extra: {
            source: 'app_modal',
            rating: feedback.rating,
            comment: feedback.comment,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Feedback API error:', data);
        setFeedbackError(data.error || 'Failed to send feedback to server.');
      } else {
        setFeedbackStatus('Sent to server.');
      }
    } catch (err) {
      console.error('Feedback network error:', err);
      setFeedbackError('Network error while sending feedback.');
    }

    setFeedbackSubmitted(true);
    setFeedback({ rating: '', comment: '' });

    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackModal(false);
      setFeedbackStatus('');
      setFeedbackError('');
    }, 3000);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode
            ? 'bg-slate-950 text-slate-50'
            : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-[960px]">
          {/* Header / Brand */}
          <header className="mb-5 sm:mb-8 bg-slate-900 text-slate-50 rounded-2xl border border-slate-800 px-4 sm:px-6 py-4 sm:py-5 shadow-md shadow-black/20">
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Round logo */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                  <img
                    src={`${process.env.PUBLIC_URL}/voidbuild-logo.png`}
                    alt="VoidBuild logo"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
                      <span className="lowercase">void</span>
                      <span className="font-bold text-emerald-400">
                        build
                      </span>
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-semibold bg-slate-100 text-slate-900">
                      early access
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    AI website builder for fast, clean HTML/CSS/JS sites.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-800 rounded-full hover:scale-105 transition-all duration-200 shadow-sm"
                aria-label="Toggle dark mode"
              >
                <span className="text-lg">
                  {darkMode ? '☀️' : '🌙'}
                </span>
              </button>
            </div>
          </header>

          {/* Main builder */}
          <Builder />
        </div>

        {/* Floating Feedback Button */}
        <button
          onClick={() => setFeedbackModal(true)}
          className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 px-3 py-2 rounded-full border border-slate-300 bg-white/90 text-slate-700 shadow-sm hover:bg-slate-100 hover:shadow-md dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 flex items-center space-x-1 text-xs sm:text-sm font-medium transition-all duration-200"
          aria-label="Open feedback"
        >
          <span>💬</span>
          <span className="hidden xs:inline sm:inline">Feedback</span>
        </button>

        {/* Feedback Modal */}
        {feedbackModal && (
          <div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
            onClick={() => setFeedbackModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl shadow-lg shadow-black/20 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-center text-slate-900 dark:text-slate-50">
                Feedback
              </h3>

              {!feedbackSubmitted ? (
                <>
                  <div className="flex justify-center space-x-4 mb-4">
                    <button
                      onClick={() =>
                        setFeedback({ ...feedback, rating: '👍' })
                      }
                      className={`text-2xl sm:text-3xl p-2 rounded-lg transition-all ${
                        feedback.rating === '👍'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() =>
                        setFeedback({ ...feedback, rating: '👎' })
                      }
                      className={`text-2xl sm:text-3xl p-2 rounded-lg transition-all ${
                        feedback.rating === '👎'
                          ? 'bg-rose-100 dark:bg-rose-900/40'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      👎
                    </button>
                  </div>

                  <textarea
                    value={feedback.comment}
                    onChange={(e) =>
                      setFeedback({ ...feedback, comment: e.target.value })
                    }
                    placeholder="Optional comment..."
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-slate-50 mb-2 text-xs sm:text-sm"
                    rows={3}
                  />

                  {feedbackError && (
                    <p className="text-center text-[11px] text-rose-500 mb-1">
                      {feedbackError}
                    </p>
                  )}
                  {feedbackStatus && (
                    <p className="text-center text-[11px] text-emerald-500 mb-1">
                      {feedbackStatus}
                    </p>
                  )}

                  <div className="text-center">
                    <button
                      onClick={submitFeedback}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 disabled:bg-slate-400"
                      disabled={!feedback.rating}
                    >
                      Submit
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  Thanks for your feedback!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;