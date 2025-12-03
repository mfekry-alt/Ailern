import { useState } from 'react';

import { Card, CardContent } from '@/components/ui';
import {
    FileText,
    Upload,
    Clock,
    CheckCircle,
    AlertCircle,
    Download,
    Calendar,
    User,
    Star,
    Eye
} from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    course: string;
    instructor: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded' | 'late';
    points: number;
    description: string;
    attachments: string[];
    grade?: number;
    feedback?: string;
    submittedAt?: string;
}

export const AssignmentsPage = () => {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const assignments: Assignment[] = [
        {
            id: '1',
            title: 'Programming Assignment 1: Basic Algorithms',
            course: 'CS101 - Introduction to Programming',
            instructor: 'Dr. Emily Carter',
            dueDate: '2024-01-15',
            status: 'graded',
            points: 100,
            description: 'Implement basic sorting algorithms including bubble sort, selection sort, and insertion sort. Include time complexity analysis.',
            attachments: ['assignment1.pdf', 'rubric.pdf'],
            grade: 95,
            feedback: 'Excellent implementation! Your code is well-documented and efficient. Consider optimizing the bubble sort algorithm.',
            submittedAt: '2024-01-14T10:30:00Z'
        },
        {
            id: '2',
            title: 'Data Structures Lab: Linked Lists',
            course: 'CS202 - Data Structures',
            instructor: 'Prof. Michael Brown',
            dueDate: '2024-01-20',
            status: 'submitted',
            points: 150,
            description: 'Create a comprehensive linked list implementation with all basic operations.',
            attachments: ['lab2.pdf'],
            submittedAt: '2024-01-19T15:45:00Z'
        },
        {
            id: '3',
            title: 'Linear Algebra Problem Set 3',
            course: 'MA203 - Linear Algebra',
            instructor: 'Dr. Sarah Wilson',
            dueDate: '2024-01-18',
            status: 'pending',
            points: 80,
            description: 'Solve problems related to eigenvalues, eigenvectors, and diagonalization.',
            attachments: ['ps3.pdf']
        },
        {
            id: '4',
            title: 'Physics Lab Report: Mechanics',
            course: 'PHY105 - Classical Mechanics',
            instructor: 'Dr. James Lee',
            dueDate: '2024-01-12',
            status: 'late',
            points: 120,
            description: 'Write a comprehensive lab report on projectile motion experiments.',
            attachments: ['lab_report_template.pdf']
        }
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return { text: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock };
            case 'submitted':
                return { text: 'Submitted', className: 'bg-blue-100 text-blue-800', icon: Upload };
            case 'graded':
                return { text: 'Graded', className: 'bg-green-100 text-green-800', icon: CheckCircle };
            case 'late':
                return { text: 'Late', className: 'bg-red-100 text-red-800', icon: AlertCircle };
            default:
                return { text: 'Unknown', className: 'bg-gray-100 text-gray-800', icon: Clock };
        }
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-green-600';
        if (grade >= 80) return 'text-blue-600';
        if (grade >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const filteredAssignments = assignments.filter(assignment => {
        const courseMatch = selectedCourse === 'all' || assignment.course.includes(selectedCourse);
        const statusMatch = selectedStatus === 'all' || assignment.status === selectedStatus;
        return courseMatch && statusMatch;
    });

    const stats = [
        { label: 'Total Assignments', value: assignments.length, icon: FileText, color: 'text-blue-600' },
        { label: 'Pending', value: assignments.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-yellow-600' },
        { label: 'Submitted', value: assignments.filter(a => a.status === 'submitted').length, icon: Upload, color: 'text-blue-600' },
        { label: 'Graded', value: assignments.filter(a => a.status === 'graded').length, icon: CheckCircle, color: 'text-green-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-[30px] font-bold leading-[36px] text-gray-900">
                        Assignments
                    </h1>
                    <p className="text-[16px] leading-[24px] text-gray-600">
                        Manage your assignments and track submission status
                    </p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const IconComponent = stat.icon;
                        return (
                            <Card key={stat.label} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-medium text-gray-600 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold text-gray-900">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Filters */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Courses</option>
                                    <option value="CS101">CS101 - Introduction to Programming</option>
                                    <option value="CS202">CS202 - Data Structures</option>
                                    <option value="MA203">MA203 - Linear Algebra</option>
                                    <option value="PHY105">PHY105 - Classical Mechanics</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="graded">Graded</option>
                                    <option value="late">Late</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.map((assignment) => {
                        const statusBadge = getStatusBadge(assignment.status);
                        const StatusIcon = statusBadge.icon;

                        return (
                            <Card key={assignment.id} variant="elevated">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Assignment Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-[18px] font-bold text-gray-900 flex-1">
                                                    {assignment.title}
                                                </h3>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${statusBadge.className}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusBadge.text}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span>{assignment.instructor}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                                    <Star className="w-4 h-4" />
                                                    <span>{assignment.points} points</span>
                                                </div>
                                                {assignment.grade && (
                                                    <div className="flex items-center gap-2 text-[14px]">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className={`font-semibold ${getGradeColor(assignment.grade)}`}>
                                                            Grade: {assignment.grade}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-[14px] text-gray-700 mb-3">
                                                {assignment.description}
                                            </p>

                                            {/* Attachments */}
                                            {assignment.attachments.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-[12px] font-medium text-gray-600 mb-2">Attachments:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {assignment.attachments.map((attachment, index) => (
                                                            <button
                                                                key={index}
                                                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[12px] text-gray-700 transition-colors"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                {attachment}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Feedback */}
                                            {assignment.feedback && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                    <p className="text-[12px] font-medium text-blue-800 mb-1">Instructor Feedback:</p>
                                                    <p className="text-[14px] text-blue-700">{assignment.feedback}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                                            {assignment.status === 'pending' && (
                                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                                    Submit Assignment
                                                </button>
                                            )}
                                            {assignment.status === 'submitted' && (
                                                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                                    View Submission
                                                </button>
                                            )}
                                            {assignment.status === 'graded' && (
                                                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                                    View Grade
                                                </button>
                                            )}
                                            {assignment.status === 'late' && (
                                                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors">
                                                    Submit Late
                                                </button>
                                            )}

                                            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredAssignments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No assignments found</h3>
                        <p className="text-gray-600">Try adjusting your filter criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};
