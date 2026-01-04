import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizzesAPI, authAPI } from '../services/api';
import { getUser, logout } from '../utils/auth';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const [pendingQuizzes, setPendingQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        setUser(currentUser);
        fetchPendingQuizzes();
    }, []);

    const fetchPendingQuizzes = async () => {
        setLoading(true);
        try {
            const response = await quizzesAPI.getPending();
            setPendingQuizzes(response.data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setQuizResult(null);
        setError('');
    };

    const handleAnswerSelect = (questionId, selectedKey) => {
        setAnswers({
            ...answers,
            [questionId]: selectedKey,
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < activeQuiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        if (Object.keys(answers).length !== activeQuiz.questions.length) {
            setError('Please answer all questions before submitting');
            return;
        }

        if (!window.confirm('Are you sure you want to submit this quiz?')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const submissionData = {
                quizId: activeQuiz.quizId,
                answers: Object.entries(answers).map(([questionId, selectedKey]) => ({
                    questionId,
                    selectedKey,
                })),
            };

            const response = await quizzesAPI.submit(submissionData);
            setQuizResult(response.data);

            // Remove quiz from pending list
            setPendingQuizzes(
                pendingQuizzes.filter((q) => q.quizId !== activeQuiz.quizId)
            );
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToQuizzes = () => {
        setActiveQuiz(null);
        setQuizResult(null);
        setAnswers({});
        setCurrentQuestionIndex(0);
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            logout();
            navigate('/login');
        }
    };

    const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
    const isAnswered = currentQuestion && answers[currentQuestion._id];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Welcome, {user?.name}</p>
                    {user?.department && <span className="dept-badge">{user.department}</span>}
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </div>

            <div className="dashboard-content">
                {error && <div className="error-message">{error}</div>}

                {/* Quiz Result View */}
                {quizResult && (
                    <div className="card result-card">
                        <h2>Quiz Completed! 🎉</h2>
                        <div className="result-summary">
                            <div className="result-item">
                                <span className="result-label">Score:</span>
                                <span className="result-value score">{quizResult.score}%</span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Correct Answers:</span>
                                <span className="result-value">
                                    {quizResult.correctAnswers} / {quizResult.totalQuestions}
                                </span>
                            </div>
                        </div>

                        <h3>Detailed Results</h3>
                        <div className="results-list">
                            {quizResult.results.map((result, index) => (
                                <div
                                    key={result.questionId}
                                    className={`result-detail ${result.isCorrect ? 'correct' : 'incorrect'}`}
                                >
                                    <div className="result-header">
                                        <span>Question {index + 1}</span>
                                        <span className={result.isCorrect ? 'correct-badge' : 'incorrect-badge'}>
                                            {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                        </span>
                                    </div>
                                    <div className="result-info">
                                        <p>Your answer: <strong>{result.selectedKey.toUpperCase()}</strong></p>
                                        {!result.isCorrect && (
                                            <p>Correct answer: <strong>{result.correctAnswer.toUpperCase()}</strong></p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={handleBackToQuizzes} className="btn-primary">
                            Back to Quizzes
                        </button>
                    </div>
                )}

                {/* Active Quiz View */}
                {activeQuiz && !quizResult && (
                    <div className="card quiz-card">
                        <div className="quiz-header">
                            <div>
                                <h2>{activeQuiz.title}</h2>
                                <p>{activeQuiz.description}</p>
                            </div>
                            <div className="quiz-progress">
                                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                            </div>
                        </div>

                        <div className="question-container">
                            <h3 className="question-text">{currentQuestion.questionText}</h3>

                            <div className="options-container">
                                {currentQuestion.options.map((option) => (
                                    <div
                                        key={option.key}
                                        className={`option ${answers[currentQuestion._id] === option.key ? 'selected' : ''
                                            }`}
                                        onClick={() => handleAnswerSelect(currentQuestion._id, option.key)}
                                    >
                                        <div className="option-key">{option.key.toUpperCase()}</div>
                                        <div className="option-text">{option.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="quiz-navigation">
                            <button
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="btn-secondary"
                            >
                                ← Previous
                            </button>

                            <div className="answer-indicator">
                                {activeQuiz.questions.map((q, index) => (
                                    <div
                                        key={q._id}
                                        className={`indicator-dot ${answers[q._id] ? 'answered' : ''} ${index === currentQuestionIndex ? 'active' : ''
                                            }`}
                                        onClick={() => setCurrentQuestionIndex(index)}
                                    />
                                ))}
                            </div>

                            {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                                <button onClick={handleNextQuestion} className="btn-secondary">
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitQuiz}
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Quiz'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Pending Quizzes List */}
                {!activeQuiz && !quizResult && (
                    <div className="card">
                        <h2>Pending Quizzes</h2>
                        {loading ? (
                            <p className="empty-state">Loading quizzes...</p>
                        ) : pendingQuizzes.length === 0 ? (
                            <p className="empty-state">No pending quizzes at the moment.</p>
                        ) : (
                            <div className="quiz-list">
                                {pendingQuizzes.map((quiz) => (
                                    <div key={quiz.assignmentId} className="quiz-item">
                                        <div>
                                            <h3>{quiz.title}</h3>
                                            <p>{quiz.description}</p>
                                            <span className="badge">{quiz.questions.length} Questions</span>
                                        </div>
                                        <button
                                            onClick={() => handleStartQuiz(quiz)}
                                            className="btn-primary"
                                        >
                                            Start Quiz
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
