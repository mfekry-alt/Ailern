import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Upload, FileText, Video, Presentation, HelpCircle, Users, Calendar, BookOpen } from 'lucide-react';

interface CourseMaterial {
    id: string;
    title: string;
    type: 'Video' | 'PDF' | 'PPT' | 'Quiz';
    uploadDate: string;
    uploadedBy: string;
    status: 'Published' | 'Draft';
    size?: string;
    duration?: string;
}

const courseMaterials: CourseMaterial[] = [
    {
        id: '1',
        title: 'Introduction to Psychology - Lecture 1',
        type: 'Video',
        uploadDate: '2024-01-15',
        uploadedBy: 'Dr. Emily Carter',
        status: 'Published',
        duration: '45:30'
    },
    {
        id: '2',
        title: 'Chapter 1: The Science of Psychology',
        type: 'PDF',
        uploadDate: '2024-01-20',
        uploadedBy: 'Dr. Emily Carter',
        status: 'Published',
        size: '2.3 MB'
    },
    {
        id: '3',
        title: 'Lecture Slides: Cognitive Processes',
        type: 'PPT',
        uploadDate: '2024-02-05',
        uploadedBy: 'Dr. Emily Carter',
        status: 'Published',
        size: '1.8 MB'
    },
    {
        id: '4',
        title: 'Assignment 1: Research Paper Outline',
        type: 'PDF',
        uploadDate: '2024-02-10',
        uploadedBy: 'Dr. Emily Carter',
        status: 'Published',
        size: '856 KB'
    },
    {
        id: '5',
        title: 'Quiz 1: Foundations of Psychology',
        type: 'Quiz',
        uploadDate: '2024-02-15',
        uploadedBy: 'Dr. Emily Carter',
        status: 'Draft',
        duration: '30 min'
    },
];

export const InstructorCourseEditContentPage = () => {
    const [activeTab, setActiveTab] = useState('Materials');

    const tabs = ['Overview', 'Materials', 'Assignments', 'Grades', 'Announcements'];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Video':
                return <Video className="w-4 h-4 text-red-500" />;
            case 'PDF':
                return <FileText className="w-4 h-4 text-red-600" />;
            case 'PPT':
                return <Presentation className="w-4 h-4 text-orange-500" />;
            case 'Quiz':
                return <HelpCircle className="w-4 h-4 text-blue-500" />;
            default:
                return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'Published') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-green-100 text-green-800">
                    Published
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-yellow-100 text-yellow-800">
                    Draft
                </span>
            );
        }
    };

    const courseStats = [
        { label: 'Total Students', value: '45', icon: Users, color: 'text-blue-600' },
        { label: 'Modules', value: '8', icon: BookOpen, color: 'text-green-600' },
        { label: 'Start Date', value: 'Jan 15', icon: Calendar, color: 'text-purple-600' },
        { label: 'Materials', value: '12', icon: FileText, color: 'text-orange-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-[36px] font-bold text-gray-900">Introduction to Psychology</h1>
                    <p className="text-[18px] text-gray-600 mt-1">PSYCH 101 - Spring 2024</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-[16px] px-6 py-3 rounded-lg transition-colors">
                        <Upload className="w-5 h-5" />
                        Upload Content
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[16px] px-6 py-3 rounded-lg transition-colors">
                        <Plus className="w-5 h-5" />
                        Add Content
                    </button>
                </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {courseStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-[20px] font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-[14px] text-gray-600">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-t-lg border border-gray-200">
                <div className="flex px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-[16px] font-medium transition-colors border-b-2 ${activeTab === tab
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        {/* Table Header */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                        Content
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                        Type
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                        Upload Date
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                        Details
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                        Status
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-[14px] font-semibold text-gray-900 uppercase tracking-wide">
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody>
                            {courseMaterials.map((material, index) => (
                                <tr
                                    key={material.id}
                                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === courseMaterials.length - 1 ? 'border-b-0' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {getTypeIcon(material.type)}
                                            <div>
                                                <p className="text-[16px] font-medium text-gray-900">
                                                    {material.title}
                                                </p>
                                                <p className="text-[14px] text-gray-600">
                                                    {material.uploadedBy}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[14px] text-gray-600">
                                            {material.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[14px] text-gray-600">
                                            {material.uploadDate}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[14px] text-gray-600">
                                            {material.size || material.duration}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(material.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button className="flex items-center gap-1 text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                                <Eye className="w-4 h-4" />
                                                Preview
                                            </button>
                                            <button className="flex items-center gap-1 text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button className="flex items-center gap-1 text-[14px] font-medium text-red-600 hover:text-red-700 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {courseMaterials.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No content yet</h3>
                    <p className="text-gray-600 mb-6">Start by adding your first course material</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                        Add Content
                    </button>
                </div>
            )}
        </div>
    );
};
