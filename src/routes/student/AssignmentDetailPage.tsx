import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Download,
    Calendar,
    User,
    Star,
    ArrowLeft,
    File
} from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    course: string;
    instructor: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
    points: number;
    description: string;
    attachments: string[];
    allowedFileTypes: string[];
    maxFileSize: string;
    grade?: number;
    feedback?: string;
    submittedAt?: string;
    submittedFile?: string;
}

export const AssignmentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submitError, setSubmitError] = useState('');

    // Mock assignment data - in real app, fetch based on id
    const [assignment, setAssignment] = useState<Assignment>({
        id: id || '1',
        title: 'Programming Assignment 1: Basic Algorithms',
        course: 'CS101 - Introduction to Programming',
        instructor: 'Dr. Emily Carter',
        dueDate: '2024-12-30T23:59:59',
        status: 'pending',
        points: 100,
        description: `Implement basic sorting algorithms including bubble sort, selection sort, and insertion sort. 

Requirements:
- Write clean, well-documented code
- Include time complexity analysis for each algorithm
- Provide test cases demonstrating correctness
- Compare performance on different input sizes

Submission Guidelines:
- Submit a single ZIP file containing all source code
- Include a README.md with instructions to run your code
- Ensure code compiles without errors`,
        attachments: ['/testpdf.pdf', '/testslide.pptx'],
        allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'ZIP'],
        maxFileSize: '10 MB',
        // Uncomment below to show submitted/graded state
        // grade: 95,
        // feedback: 'Excellent implementation! Your code is well-documented and efficient. Consider optimizing the bubble sort algorithm for better performance on nearly-sorted arrays.',
        // submittedAt: '2024-12-28T10:30:00',
        // submittedFile: 'assignment1_submission.zip',
        // status: 'graded'
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSubmitError('');

        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Validate file type
        const ext = file.name.split('.').pop()?.toUpperCase();
        if (ext && !assignment.allowedFileTypes.includes(ext)) {
            setSubmitError(`Invalid file type. Allowed types: ${assignment.allowedFileTypes.join(', ')}`);
            setSelectedFile(null);
            return;
        }

        // Validate file size
        const maxSizeMB = parseInt(assignment.maxFileSize);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setSubmitError(`File too large. Maximum size: ${assignment.maxFileSize}`);
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setSubmitError('Please select a file to submit.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);

        // Simulate API call
        setTimeout(() => {
            const submittedAt = new Date().toISOString();
            setAssignment({
                ...assignment,
                status: 'submitted',
                submittedAt,
                submittedFile: selectedFile.name
            });
            setUploading(false);
            setSelectedFile(null);
        }, 2200);
    };

    const getDeadlineStatus = () => {
        if (!assignment.submittedAt) return null;

        const dueDate = new Date(assignment.dueDate);
        const submittedDate = new Date(assignment.submittedAt);

        if (submittedDate <= dueDate) {
            return {
                text: 'Submitted on time ✓',
                color: 'text-green-700',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-300'
            };
        } else {
            const hoursLate = Math.round((submittedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
            return {
                text: `Submitted ${hoursLate} hour${hoursLate > 1 ? 's' : ''} after deadline`,
                color: 'text-red-700',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-300'
            };
        }
    };

    const deadlineStatus = getDeadlineStatus();
    const isDueSoon = new Date(assignment.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Assignments
                    </button>
                    <h1 className="text-[32px] font-bold text-gray-900 mb-2">{assignment.title}</h1>
                    <p className="text-[16px] text-gray-600">{assignment.course}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Assignment Details */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h2 className="text-[20px] font-bold text-gray-900 mb-4">Assignment Details</h2>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-[14px] font-semibold text-gray-700 mb-2">Description</h3>
                                        <p className="text-[14px] text-gray-700 whitespace-pre-line leading-relaxed">
                                            {assignment.description}
                                        </p>
                                    </div>

                                    {assignment.attachments.length > 0 && (
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-gray-700 mb-2">Attachments</h3>
                                            <div className="space-y-2">
                                                {assignment.attachments.map((attachment, index) => (
                                                    <a
                                                        key={index}
                                                        href={attachment}
                                                        download
                                                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4 text-gray-600" />
                                                        <span className="text-[14px] text-gray-700 flex-1">
                                                            {attachment.split('/').pop()}
                                                        </span>
                                                        <Download className="w-4 h-4 text-gray-500" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submission Section */}
                        {assignment.status === 'pending' && (
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <h2 className="text-[20px] font-bold text-gray-900 mb-4">Submit Your Work</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                                Upload File
                                            </label>
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept={assignment.allowedFileTypes.map(type => `.${type.toLowerCase()}`).join(',')}
                                                disabled={uploading}
                                                className="block w-full text-[14px] text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[14px] file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-lg"
                                            />
                                            {selectedFile && (
                                                <div className="mt-2 flex items-center gap-2 text-[13px] text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                </div>
                                            )}
                                            {submitError && (
                                                <div className="mt-2 flex items-center gap-2 text-[13px] text-red-600">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{submitError}</span>
                                                </div>
                                            )}
                                        </div>

                                        {uploading && (
                                            <div>
                                                <div className="flex items-center justify-between text-[13px] text-gray-600 mb-2">
                                                    <span>Uploading...</span>
                                                    <span>{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!selectedFile || uploading}
                                            className={`w-full font-medium text-[16px] px-6 py-3 rounded-lg transition-colors ${!selectedFile || uploading
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {uploading ? 'Submitting...' : 'Submit Assignment'}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Submission Confirmation */}
                        {assignment.status === 'submitted' && deadlineStatus && (
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <div className={`p-4 rounded-lg border-2 ${deadlineStatus.bgColor} ${deadlineStatus.borderColor}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle className={`w-6 h-6 ${deadlineStatus.color}`} />
                                            <div>
                                                <h3 className={`text-[16px] font-bold ${deadlineStatus.color}`}>
                                                    Assignment Submitted
                                                </h3>
                                                <p className={`text-[14px] font-medium ${deadlineStatus.color}`}>
                                                    {deadlineStatus.text}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-[14px] text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span>Submitted: {new Date(assignment.submittedAt!).toLocaleString()}</span>
                                            </div>
                                            {assignment.submittedFile && (
                                                <div className="flex items-center gap-2">
                                                    <File className="w-4 h-4 text-gray-500" />
                                                    <span>File: {assignment.submittedFile}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Grade and Feedback */}
                        {assignment.status === 'graded' && (
                            <Card variant="elevated">
                                <CardContent className="p-6">
                                    <h2 className="text-[20px] font-bold text-gray-900 mb-4">Grade & Feedback</h2>

                                    <div className="space-y-4">
                                        {deadlineStatus && (
                                            <div className={`p-3 rounded-lg border ${deadlineStatus.bgColor} ${deadlineStatus.borderColor}`}>
                                                <p className={`text-[14px] font-medium ${deadlineStatus.color}`}>
                                                    {deadlineStatus.text}
                                                </p>
                                                <p className="text-[13px] text-gray-600 mt-1">
                                                    Submitted: {new Date(assignment.submittedAt!).toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                                            <div className="text-center mb-4">
                                                <div className="text-[48px] font-bold text-blue-600">
                                                    {assignment.grade}%
                                                </div>
                                                <div className="text-[16px] text-gray-600">
                                                    {assignment.grade! >= 90 ? 'Excellent!' : assignment.grade! >= 80 ? 'Great Work!' : assignment.grade! >= 70 ? 'Good Job!' : 'Keep Improving!'}
                                                </div>
                                            </div>
                                            <div className="flex justify-center gap-2 text-[14px] text-gray-600">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                <span>{assignment.grade} / {assignment.points} points</span>
                                            </div>
                                        </div>

                                        {assignment.feedback && (
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <h3 className="text-[14px] font-semibold text-blue-900 mb-2">
                                                    Instructor Feedback
                                                </h3>
                                                <p className="text-[14px] text-blue-800 leading-relaxed">
                                                    {assignment.feedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Assignment Info */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h3 className="text-[16px] font-bold text-gray-900 mb-4">Assignment Info</h3>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Due Date</span>
                                        </div>
                                        <p className={`text-[14px] font-semibold ${isDueSoon && assignment.status === 'pending' ? 'text-red-600' : 'text-gray-900'}`}>
                                            {new Date(assignment.dueDate).toLocaleString()}
                                        </p>
                                        {isDueSoon && assignment.status === 'pending' && (
                                            <p className="text-[12px] text-red-600 mt-1">Due soon!</p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
                                            <User className="w-4 h-4" />
                                            <span>Instructor</span>
                                        </div>
                                        <p className="text-[14px] font-semibold text-gray-900">{assignment.instructor}</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
                                            <Star className="w-4 h-4" />
                                            <span>Points</span>
                                        </div>
                                        <p className="text-[14px] font-semibold text-gray-900">{assignment.points} points</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span>Status</span>
                                        </div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[13px] font-medium ${assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {assignment.status === 'pending' ? 'Pending' :
                                                assignment.status === 'submitted' ? 'Submitted' :
                                                    'Graded'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submission Requirements */}
                        <Card variant="elevated">
                            <CardContent className="p-6">
                                <h3 className="text-[16px] font-bold text-gray-900 mb-4">Submission Requirements</h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[13px] text-gray-500 mb-1">Allowed File Types</p>
                                        <div className="flex flex-wrap gap-2">
                                            {assignment.allowedFileTypes.map((type) => (
                                                <span
                                                    key={type}
                                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[12px] font-medium"
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[13px] text-gray-500 mb-1">Maximum File Size</p>
                                        <p className="text-[14px] font-semibold text-gray-900">{assignment.maxFileSize}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
