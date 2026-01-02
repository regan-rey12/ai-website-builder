import React, { useState } from 'react';
import Builder from './components/builder';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: '', comment: '' });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const submitFeedback = () => {
    if (!feedback.rating) return; // Require rating
    const storedFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    storedFeedback.push({ ...feedback, date: new Date().toISOString() });
    localStorage.setItem('feedback', JSON.stringify(storedFeedback));
    setFeedbackSubmitted(true);
    setFeedback({ rating: '', comment: '' });
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackModal(false);
    }, 3000); // Close modal after 3 seconds
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode
            ? 'bg-gray-900 text-white'
            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
        }`}
      >
        <div className="container mx-auto px-6 py-8 max-w-[900px]">
          <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg shadow-black/5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                WB
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Website Builder
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create stunning websites with AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:scale-105 transition-all duration-200 shadow-md"
              aria-label="Toggle dark mode"
            >
              <span className="text-xl">
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          </header>

          <Builder />
        </div>

        {/* Floating Feedback Button */}
        <button
          onClick={() => setFeedbackModal(true)}
          className="fixed bottom-6 right-6 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg shadow-black/5 hover:scale-110 transition-all duration-200 flex items-center space-x-1 text-sm font-bold"
          aria-label="Open feedback"
        >
          <span>💬</span>
          <span>Feedback</span>
        </button>

        {/* Feedback Modal */}
        {feedbackModal && (
          <div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
            onClick={() => setFeedbackModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg shadow-black/5 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 text-center text-gray-900 dark:text-white">
                Feedback
              </h3>
              {!feedbackSubmitted ? (
                <>
                  <div className="flex justify-center space-x-4 mb-4">
                    <button
                      onClick={() => setFeedback({ ...feedback, rating: '👍' })}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        feedback.rating === '👍'
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => setFeedback({ ...feedback, rating: '👎' })}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        feedback.rating === '👎'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white mb-4 text-sm"
                    rows={3}
                  />
                  <div className="text-center">
                    <button
                      onClick={submitFeedback}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-200"
                      disabled={!feedback.rating}
                    >
                      Submit
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-green-600 dark:text-green-400 font-semibold">
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