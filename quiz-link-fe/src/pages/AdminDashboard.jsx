import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, departmentsAPI, authAPI } from '../services/api';
import { getUser, logout } from '../utils/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        departmentId: '',
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await usersAPI.addTeacher(formData);
            setSuccess(response.data.msg);
            setTeachers([...teachers, response.data.user]);

            // Reset form
            setFormData({
                name: '',
                email: '',
                password: '',
                departmentId: '',
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to add teacher');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeacher = async (teacherId) => {
        if (!window.confirm('Are you sure you want to delete this teacher?')) {
            return;
        }

        try {
            await usersAPI.deleteTeacher(teacherId);
            setTeachers(teachers.filter((t) => t.id !== teacherId));
            setSuccess('Teacher deleted successfully');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete teacher');
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
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </div>

            <div className="dashboard-content">
                {/* Add Teacher Section */}
                <div className="card">
                    <h2>Add New Teacher</h2>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleAddTeacher} className="form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Teacher name"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="teacher@example.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Password"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="departmentId">Department (Optional)</label>
                                <select
                                    id="departmentId"
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="">No Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept._id} value={dept._id}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Teacher'}
                        </button>
                    </form>
                </div>

                {/* Teachers List */}
                {teachers.length > 0 && (
                    <div className="card">
                        <h2>Teachers</h2>
                        <div className="list">
                            {teachers.map((teacher) => (
                                <div key={teacher.id} className="list-item">
                                    <div>
                                        <h3>{teacher.name}</h3>
                                        <p>{teacher.email}</p>
                                        {teacher.department && <span className="badge">Department: {teacher.department}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTeacher(teacher.id)}
                                        className="btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Departments Section */}
                <div className="card">
                    <h2>Departments</h2>
                    <div className="departments-grid">
                        {departments.map((dept) => (
                            <div key={dept._id} className="department-card">
                                <h3>{dept.name}</h3>
                                <p className="dept-code">{dept.code}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
