import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, Save, Upload, X, FileText } from 'lucide-react';

export const InstructorAssignmentEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [attachments, setAttachments] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        dueDate: '',
        totalPoints: 100,
        allowedFileTypes: [] as string[],
        maxFileSize: '',
        status: 'draft' as 'draft' | 'published',
    });

    // Load assignment data (in real app, this would be an API call)
    useEffect(() => {
        // Mock data - replace with API call
        setFormData({
            title: 'Programming Assignment 1: Basic Algorithms',
            description: 'Implement basic sorting algorithms including bubble sort, selection sort, and insertion sort.',
            course: 'CS101 - Introduction to Programming',
            dueDate: '2024-01-15T23:59',
            totalPoints: 100,
            allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'ZIP'],
            maxFileSize: '10',
            status: 'published',
        });
    }, [id]);

    const fileTypeOptions = ['PDF', 'DOC', 'DOCX', 'ZIP', 'TXT', 'PPT', 'PPTX'];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const toggleFileType = (type: string) => {
        setFormData({
            ...formData,
            allowedFileTypes: formData.allowedFileTypes.includes(type)
                ? formData.allowedFileTypes.filter((t) => t !== type)
                : [...formData.allowedFileTypes, type],
        });
    };

    const handleSave = (isDraft: boolean) => {
        if (!formData.title.trim()) {
            setStatusMessage('Assignment title is required.');
            return;
        }

        setStatusMessage(isDraft ? 'Draft saved successfully!' : 'Assignment updated successfully!');
        // API call would go here
        setTimeout(() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS), 1500);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-4xl mx-auto">
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-[30px] font-bold text-gray-900 mb-2">Edit Assignment</h1>
                                    <p className="text-[16px] text-gray-600">Update assignment details</p>
                                </div>
                                <button
                                    onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            </div>

                            {statusMessage && (
                                <div className={`p-4 rounded-lg ${
                                    statusMessage.includes('success')
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                }`}>
                                    <p className="text-sm">{statusMessage}</p>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                    Assignment Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Programming Assignment 1: Basic Algorithms"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                />
                            </div>

                            {/* Course */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                    Course <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                >
                                    <option value="">Select a course</option>
                                    <option value="CS101 - Introduction to Programming">CS101 - Introduction to Programming</option>
                                    <option value="CS202 - Data Structures">CS202 - Data Structures</option>
                                    <option value="MA203 - Linear Algebra">MA203 - Linear Algebra</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    placeholder="Provide detailed instructions for the assignment..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px] resize-none"
                                />
                            </div>

                            {/* Due Date and Points */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                        Total Points <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.totalPoints}
                                        onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 100 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            {/* File Restrictions */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                        Allowed File Types
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {fileTypeOptions.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleFileType(type)}
                                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                                                    formData.allowedFileTypes.includes(type)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                        Maximum File Size
                                    </label>
                                    <select
                                        value={formData.maxFileSize}
                                        onChange={(e) => setFormData({ ...formData, maxFileSize: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                                    >
                                        <option value="">No limit</option>
                                        <option value="5">5 MB</option>
                                        <option value="10">10 MB</option>
                                        <option value="20">20 MB</option>
                                        <option value="50">50 MB</option>
                                        <option value="100">100 MB</option>
                                    </select>
                                </div>
                            </div>

                            {/* Attachments */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                                    Attachments (Optional)
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-600" />
                                        <span className="text-[14px] font-medium text-gray-700">Upload Files</span>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    {attachments.length > 0 && (
                                        <div className="space-y-2">
                                            {attachments.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-600" />
                                                        <span className="text-[14px] text-gray-900">{file.name}</span>
                                                        <span className="text-[12px] text-gray-500">
                                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeAttachment(index)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(ROUTES.INSTRUCTOR_ASSIGNMENTS)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[14px] rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSave(false)}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-[14px] rounded-lg transition-colors"
                                    >
                                        Update Assignment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


