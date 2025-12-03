import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { FileText, Play, HelpCircle, Download } from 'lucide-react';

export const CourseDetailPage = () => {
    const { id } = useParams();

    const course = {
        id: id || '1',
        title: 'Introduction to Artificial Intelligence',
        instructor: 'Dr. Alan Turing',
        description: 'This course provides a comprehensive introduction to the fundamental concepts and techniques of Artificial Intelligence. Students will explore the history of AI, search algorithms, knowledge representation and reasoning, machine learning, natural language processing, computer vision, and the ethical implications of AI technologies.',
        learningObjectives: [
            'Understand the core concepts and history of Artificial Intelligence.',
            'Apply various search algorithms to solve complex problems.',
            'Learn the principles of knowledge representation and logical reasoning.',
            'Grasp the fundamentals of machine learning, including supervised and unsupervised learning.',
            'Develop an understanding of natural language processing and computer vision.',
            'Analyze the ethical and social impacts of AI.'
        ],
        materials: [
            {
                id: 1,
                title: 'Week 1: Introduction to AI',
                type: 'Lecture Slides',
                icon: FileText
            },
            {
                id: 2,
                title: 'Assignment 1: Search Algorithms',
                type: 'PDF Document',
                icon: FileText
            },
            {
                id: 3,
                title: 'Video: Machine Learning Basics',
                type: 'Video Lecture',
                icon: Play
            },
            {
                id: 4,
                title: 'Quiz 1',
                type: 'Online Quiz',
                icon: HelpCircle
            }
        ],
        isEnrolled: true,
        progress: 45
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Course Title and Instructor */}
                    <div>
                        <h1 className="text-[36px] font-bold leading-[40px] text-gray-900 mb-2">
                            {course.title}
                        </h1>
                        <p className="text-[18px] leading-[28px] text-gray-600">
                            Instructor: {course.instructor}
                        </p>
                    </div>

                    {/* Course Description */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h2 className="text-[24px] font-bold text-gray-900 mb-4">Course Description</h2>
                            <p className="text-[16px] leading-[24px] text-gray-700">
                                {course.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Learning Objectives */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h2 className="text-[24px] font-bold text-gray-900 mb-4">Learning Objectives</h2>
                            <ul className="space-y-3">
                                {course.learningObjectives.map((objective, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-[16px] leading-[24px] text-gray-700">{objective}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Course Materials */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h2 className="text-[24px] font-bold text-gray-900 mb-4">Course Materials</h2>
                            <div className="space-y-4">
                                {course.materials.map((material) => {
                                    const IconComponent = material.icon;
                                    return (
                                        <div key={material.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <IconComponent className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <span className="text-[16px] font-medium text-gray-900">{material.title}</span>
                                            </div>
                                            <span className="text-[14px] text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                                {material.type}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Enrollment Status */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h3 className="text-[20px] font-bold text-gray-900 mb-4">Enrollment Status</h3>
                            {course.isEnrolled ? (
                                <div className="space-y-4">
                                    <p className="text-[16px] text-gray-700">You are enrolled in this course.</p>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[14px] font-medium text-gray-700">Your Progress</span>
                                            <span className="text-[14px] font-bold text-green-600">{course.progress}% Complete</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{ width: `${course.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                                        Go to Course
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-[16px] text-gray-700">You are not currently enrolled in this course.</p>
                                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                        Request to Join
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Course Syllabus */}
                    <Card variant="elevated">
                        <CardContent className="p-6">
                            <h3 className="text-[20px] font-bold text-gray-900 mb-4">Course Syllabus</h3>
                            <p className="text-[16px] text-gray-700 mb-4">
                                Download the complete course syllabus for detailed information on topics, schedule, and grading.
                            </p>
                            <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                                <Download className="w-5 h-5" />
                                Download Syllabus (PDF)
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

