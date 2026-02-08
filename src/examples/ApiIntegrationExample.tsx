/**
 * Example React Component demonstrating API integration
 * This shows how to use the API services with React Query
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, courseService, userService } from '@/api/services';
import { handleApiError } from '@/api/client';
import type { PaginationParams } from '@/types/api.types';

// ============================================================================
// Custom Hooks for API calls
// ============================================================================

/**
 * Hook for fetching courses with pagination
 */
export const useCourses = (params?: PaginationParams) => {
    return useQuery({
        queryKey: ['courses', params],
        queryFn: () => courseService.getAllCourses(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook for fetching a single course
 */
export const useCourse = (id: number) => {
    return useQuery({
        queryKey: ['course', id],
        queryFn: () => courseService.getCourseById(id),
        enabled: !!id,
    });
};

/**
 * Hook for creating a course
 */
export const useCreateCourse = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: courseService.createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
};

/**
 * Hook for enrolling in a course
 */
export const useEnrollInCourse = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (courseId: number) => courseService.enrollInCourse(courseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['my-courses'] });
        },
    });
};

/**
 * Hook for user login
 */
export const useLogin = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            // Invalidate all queries after login
            queryClient.invalidateQueries();
            return data;
        },
    });
};

// ============================================================================
// Example Component: Login Form
// ============================================================================

export const LoginExample = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const loginMutation = useLogin();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const result = await loginMutation.mutateAsync({
                email,
                password,
            });
            
            console.log('Login successful!');
            console.log('User:', result.userName);
            console.log('Role:', result.role);
            
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } catch (err) {
            const apiError = handleApiError(err);
            setError(apiError.message);
        }
    };
    
    return (
        <div className="login-form">
            <h2>Login</h2>
            {error && <div className="error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                <button type="submit" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

// ============================================================================
// Example Component: Course List
// ============================================================================

export const CourseListExample = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    
    const { data, isLoading, error, refetch } = useCourses({
        PageNumber: page,
        PageSize: 10,
        SearchString: search,
        SortBy: 'name',
        Order: 'asc',
    });
    
    const enrollMutation = useEnrollInCourse();
    
    const handleEnroll = async (courseId: number) => {
        try {
            await enrollMutation.mutateAsync(courseId);
            alert('Enrollment request submitted!');
        } catch (err) {
            const apiError = handleApiError(err);
            alert(`Failed to enroll: ${apiError.message}`);
        }
    };
    
    if (isLoading) {
        return <div>Loading courses...</div>;
    }
    
    if (error) {
        const apiError = handleApiError(error);
        return <div>Error: {apiError.message}</div>;
    }
    
    return (
        <div className="course-list">
            <h2>Available Courses</h2>
            
            <div className="search">
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="courses">
                {data?.items.map((course) => (
                    <div key={course.id} className="course-card">
                        <h3>{course.name}</h3>
                        <p>Code: {course.code}</p>
                        <p>Status: {course.courseStatus}</p>
                        <p>Created: {new Date(course.createdAt).toLocaleDateString()}</p>
                        
                        <button
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollMutation.isPending}
                        >
                            Enroll
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="pagination">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </button>
                
                <span>
                    Page {page} of {data?.pagesCount || 1}
                </span>
                
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= (data?.pagesCount || 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// Example Component: Course Details
// ============================================================================

interface CourseDetailsProps {
    courseId: number;
}

export const CourseDetailsExample = ({ courseId }: CourseDetailsProps) => {
    const { data: course, isLoading, error } = useCourse(courseId);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    const loadStudents = async () => {
        setLoadingStudents(true);
        try {
            const studentList = await courseService.getCourseStudents(courseId);
            setStudents(studentList);
        } catch (err) {
            console.error('Failed to load students:', err);
        } finally {
            setLoadingStudents(false);
        }
    };
    
    if (isLoading) {
        return <div>Loading course details...</div>;
    }
    
    if (error) {
        const apiError = handleApiError(error);
        return <div>Error: {apiError.message}</div>;
    }
    
    if (!course) {
        return <div>Course not found</div>;
    }
    
    return (
        <div className="course-details">
            <h1>{course.name}</h1>
            <p><strong>Code:</strong> {course.code}</p>
            <p><strong>Description:</strong> {course.description}</p>
            <p><strong>Instructor:</strong> {course.instructorName}</p>
            <p><strong>Status:</strong> {course.courseStatus}</p>
            <p><strong>Created:</strong> {new Date(course.createdAt).toLocaleString()}</p>
            
            <div className="students-section">
                <h2>Enrolled Students</h2>
                <button onClick={loadStudents} disabled={loadingStudents}>
                    {loadingStudents ? 'Loading...' : 'Load Students'}
                </button>
                
                {students.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.studentId}</td>
                                    <td>{student.fullName}</td>
                                    <td>{student.email}</td>
                                    <td>{student.phoneNumber}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Example Component: Create Course Form (Instructor)
// ============================================================================

export const CreateCourseExample = () => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const createMutation = useCreateCourse();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        
        try {
            await createMutation.mutateAsync({
                code,
                name,
                description,
            });
            
            setSuccess(true);
            // Reset form
            setCode('');
            setName('');
            setDescription('');
        } catch (err) {
            const apiError = handleApiError(err);
            setError(apiError.message);
        }
    };
    
    return (
        <div className="create-course-form">
            <h2>Create New Course</h2>
            
            {error && <div className="error">{error}</div>}
            {success && <div className="success">Course created successfully!</div>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Course Code:</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label>Course Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        required
                    />
                </div>
                
                <button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Course'}
                </button>
            </form>
        </div>
    );
};

// ============================================================================
// Example Component: Registration Form
// ============================================================================

type UserType = 'student' | 'instructor' | 'admin';

export const RegistrationExample = () => {
    const [userType, setUserType] = useState<UserType>('student');
    const [formData, setFormData] = useState({
        fullName: '',
        userName: '',
        email: '',
        password: '',
        phoneNumber: '',
        studentId: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);
        
        try {
            const baseData = {
                fullName: formData.fullName,
                userName: formData.userName,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber,
            };
            
            if (userType === 'student') {
                await userService.registerStudent({
                    ...baseData,
                    studentId: parseInt(formData.studentId),
                });
            } else if (userType === 'instructor') {
                await userService.registerInstructor(baseData);
            } else {
                await userService.registerAdmin(baseData);
            }
            
            setSuccess(true);
            // Reset form
            setFormData({
                fullName: '',
                userName: '',
                email: '',
                password: '',
                phoneNumber: '',
                studentId: '',
            });
        } catch (err) {
            const apiError = handleApiError(err);
            setError(apiError.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="registration-form">
            <h2>Register</h2>
            
            {error && <div className="error">{error}</div>}
            {success && <div className="success">Registration successful! Please check your email.</div>}
            
            <div className="user-type-selector">
                <label>
                    <input
                        type="radio"
                        value="student"
                        checked={userType === 'student'}
                        onChange={(e) => setUserType(e.target.value as UserType)}
                    />
                    Student
                </label>
                <label>
                    <input
                        type="radio"
                        value="instructor"
                        checked={userType === 'instructor'}
                        onChange={(e) => setUserType(e.target.value as UserType)}
                    />
                    Instructor
                </label>
                <label>
                    <input
                        type="radio"
                        value="admin"
                        checked={userType === 'admin'}
                        onChange={(e) => setUserType(e.target.value as UserType)}
                    />
                    Admin
                </label>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Full Name:</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                </div>
                
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={formData.userName}
                        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                        required
                    />
                </div>
                
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>
                
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                
                <div>
                    <label>Phone Number:</label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                </div>
                
                {userType === 'student' && (
                    <div>
                        <label>Student ID:</label>
                        <input
                            type="number"
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            required
                        />
                    </div>
                )}
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
};
