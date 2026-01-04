import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizzesAPI, authAPI, departmentsAPI } from '../services/api';
import { getUser, logout } from '../utils/auth';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('create'); // create, assign, results
    const [departments, setDepartments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizResults, setQuizResults] = useState([]);

    // Quiz creation form
    const [quizForm, setQuizForm] = useState({
        title: '',
        description: '',
        departmentId: '',
    });
    const [questions, setQuestions] = useState([
        {
            questionText: '',
            options: [
                { key: 'a', text: '' },
                { key: 'b', text: '' },
                { key: 'c', text: '' },
                { key: 'd', text: '' },
            ],
            correctAnswer: '',
        },
    ]);

    // Assignment form
    const [assignForm, setAssignForm] = useState({
        quizId: '',
        studentId: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getUser();
        setUser(currentUser);
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await departmentsAPI.getAll();
            setDepartments(response.data);
        } catch (err) {
            setError('Failed to load departments');
        }
    };

    const handleQuizFormChange = (e) => {
        setQuizForm({
            ...quizForm,
            [e.target.name]: e.target.value,
        });
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index][field] = value;
        setQuestions(updatedQuestions);
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[qIndex].options[optIndex].text = value;
        setQuestions(updatedQuestions);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                questionText: '',
                options: [
                    { key: 'a', text: '' },
                    { key: 'b', text: '' },
                    { key: 'c', text: '' },
                    { key: 'd', text: '' },
                ],
                correctAnswer: '',
            },
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const quizData = {
                ...quizForm,
                questions: questions,
            };
            const response = await quizzesAPI.create(quizData);
            setSuccess(response.data.msg);
            setQuizzes([...quizzes, response.data.quiz]);

            // Reset form
            setQuizForm({ title: '', description: '', departmentId: '' });
            setQuestions([
                {
                    questionText: '',
                    options: [
                        { key: 'a', text: '' },
                        { key: 'b', text: '' },
                        { key: 'c', text: '' },
                        { key: 'd', text: '' },
                    ],
                    correctAnswer: '',
                },
            ]);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) {
            return;
        }

        try {
            await quizzesAPI.delete(quizId);
            setQuizzes(quizzes.filter((q) => q._id !== quizId));
            setSuccess('Quiz deleted successfully');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete quiz');
        }
    };

    const handleAssignQuiz = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await quizzesAPI.assign(assignForm);
            setSuccess(response.data.msg);
            setAssignForm({ quizId: '', studentId: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to assign quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleViewResults = async (quizId) => {
        setError('');
        setLoading(true);
        setSelectedQuiz(quizId);

        try {
            const response = await quizzesAPI.getResults(quizId);
            setQuizResults(response.data);
            setActiveTab('results');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to load results');
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Teacher Dashboard</h1>
                    <p>Welcome, {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    Create Quiz
                </button>
                <button
                    className={`tab ${activeTab === 'assign' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assign')}
                >
                    Assign Quiz
                </button>
                <button
                    className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quizzes')}
                >
                    My Quizzes
                </button>
            </div>

            <div className="dashboard-content">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* Create Quiz Tab */}
                {activeTab === 'create' && (
                    <div className="card">
                        <h2>Create New Quiz</h2>
                        <form onSubmit={handleCreateQuiz} className="form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="title">Quiz Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={quizForm.title}
                                        onChange={handleQuizFormChange}
                                        required
                                        placeholder="e.g., Math Quiz 1"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="departmentId">Department</label>
                                    <select
                                        id="departmentId"
                                        name="departmentId"
                                        value={quizForm.departmentId}
                                        onChange={handleQuizFormChange}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept._id} value={dept._id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={quizForm.description}
                                    onChange={handleQuizFormChange}
                                    required
                                    placeholder="Quiz description"
                                    rows="3"
                                    disabled={loading}
                                />
                            </div>

                            <h3>Questions</h3>
                            {questions.map((question, qIndex) => (
                                <div key={qIndex} className="question-block">
                                    <div className="question-header">
                                        <h4>Question {qIndex + 1}</h4>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(qIndex)}
                                                className="btn-remove"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Question Text</label>
                                        <input
                                            type="text"
                                            value={question.questionText}
                                            onChange={(e) =>
                                                handleQuestionChange(qIndex, 'questionText', e.target.value)
                                            }
                                            required
                                            placeholder="Enter question"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="options-grid">
                                        {question.options.map((option, optIndex) => (
                                            <div key={option.key} className="form-group">
                                                <label>Option {option.key.toUpperCase()}</label>
                                                <input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) =>
                                                        handleOptionChange(qIndex, optIndex, e.target.value)
                                                    }
                                                    required
                                                    placeholder={`Option ${option.key}`}
                                                    disabled={loading}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="form-group">
                                        <label>Correct Answer</label>
                                        <select
                                            value={question.correctAnswer}
                                            onChange={(e) =>
                                                handleQuestionChange(qIndex, 'correctAnswer', e.target.value)
                                            }
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Select correct answer</option>
                                            <option value="a">A</option>
                                            <option value="b">B</option>
                                            <option value="c">C</option>
                                            <option value="d">D</option>
                                        </select>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={addQuestion} className="btn-secondary">
                                + Add Question
                            </button>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Quiz'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Assign Quiz Tab */}
                {activeTab === 'assign' && (
                    <div className="card">
                        <h2>Assign Quiz to Student</h2>
                        <form onSubmit={handleAssignQuiz} className="form">
                            <div className="form-group">
                                <label htmlFor="quizId">Select Quiz</label>
                                <input
                                    type="text"
                                    id="quizId"
                                    name="quizId"
                                    value={assignForm.quizId}
                                    onChange={(e) =>
                                        setAssignForm({ ...assignForm, quizId: e.target.value })
                                    }
                                    required
                                    placeholder="Enter Quiz ID"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="studentId">Student ID</label>
                                <input
                                    type="text"
                                    id="studentId"
                                    name="studentId"
                                    value={assignForm.studentId}
                                    onChange={(e) =>
                                        setAssignForm({ ...assignForm, studentId: e.target.value })
                                    }
                                    required
                                    placeholder="Enter Student ID"
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Assigning...' : 'Assign Quiz'}
                            </button>
                        </form>
                    </div>
                )}

                {/* My Quizzes Tab */}
                {activeTab === 'quizzes' && (
                    <div className="card">
                        <h2>My Quizzes</h2>
                        {quizzes.length === 0 ? (
                            <p className="empty-state">No quizzes created yet.</p>
                        ) : (
                            <div className="list">
                                {quizzes.map((quiz) => (
                                    <div key={quiz._id} className="list-item">
                                        <div>
                                            <h3>{quiz.title}</h3>
                                            <p>{quiz.description}</p>
                                            <span className="badge">{quiz.questions?.length || 0} Questions</span>
                                        </div>
                                        <div className="button-group">
                                            <button
                                                onClick={() => handleViewResults(quiz._id)}
                                                className="btn-secondary"
                                            >
                                                View Results
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz._id)}
                                                className="btn-danger"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Results Tab */}
                {activeTab === 'results' && (
                    <div className="card">
                        <h2>Quiz Results</h2>
                        {quizResults.length === 0 ? (
                            <p className="empty-state">No submissions yet.</p>
                        ) : (
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Email</th>
                                        <th>Score</th>
                                        <th>Completed At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quizResults.map((result) => (
                                        <tr key={result._id}>
                                            <td>{result.student.name}</td>
                                            <td>{result.student.email}</td>
                                            <td>
                                                <span className="score-badge">{result.score}%</span>
                                            </td>
                                            <td>{new Date(result.completedAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
