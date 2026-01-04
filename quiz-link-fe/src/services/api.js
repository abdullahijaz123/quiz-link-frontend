import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token;
    }

    // Log request for debugging
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      hasToken: !!token,
      data: config.data
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log all errors for debugging
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.msg || error.message,
      url: error.config?.url,
      data: error.response?.data
    });

    // Don't auto-redirect - let components handle errors
    if (error.response?.status === 401) {
      console.error('Authentication error - token may be invalid');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

// ==================== DEPARTMENTS APIs ====================
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
};

// ==================== USER MANAGEMENT APIs (Admin) ====================
export const usersAPI = {
  addTeacher: (teacherData) => api.post('/users/teacher/add', teacherData),
  deleteTeacher: (teacherId) => api.delete(`/users/teacher/delete/${teacherId}`),
};

// ==================== QUIZ APIs ====================
export const quizzesAPI = {
  // Teacher/Admin: Create quiz
  create: (quizData) => api.post('/quizzes/create', quizData),

  // Teacher/Admin: Delete quiz
  delete: (quizId) => api.delete(`/quizzes/delete/${quizId}`),

  // Teacher/Admin: Assign quiz to student
  assign: (assignmentData) => api.post('/quizzes/assign', assignmentData),

  // Teacher/Admin: Get quiz results
  getResults: (quizId) => api.get(`/quizzes/results/${quizId}`),

  // Student: Get pending quizzes
  getPending: () => api.get('/quizzes/student/pending'),

  // Student: Submit quiz
  submit: (submissionData) => api.post('/quizzes/student/submit', submissionData),
};

export default api;
