import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button } from '@/components/ui';
import { Play, Volume2, Maximize, Settings, ChevronLeft, ChevronRight, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export const LessonPlayerPage = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    const [resources, setResources] = useState([
        {
            id: 1,
            title: 'Machine Learning Basics - PDF',
            type: 'PDF',
            size: '2.3 MB',
            downloaded: true
        },
        {
            id: 2,
            title: 'Algorithm Comparison Chart',
            type: 'Image',
            size: '1.1 MB',
            downloaded: false
        },
        {
            id: 3,
            title: 'Practice Exercises',
            type: 'Document',
            size: '856 KB',
            downloaded: true
        }
    ]);

    const [notes, setNotes] = useState([
        {
            id: 1,
            timestamp: '05:30',
            content: 'Important: Supervised learning requires labeled training data',
            type: 'note' as const
        },
        {
            id: 2,
            timestamp: '12:45',
            content: 'Key difference between classification and regression',
            type: 'highlight' as const
        },
        {
            id: 3,
            timestamp: '28:15',
            content: 'Clustering algorithms group similar data points together',
            type: 'note' as const
        }
    ]);

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteForm, setNoteForm] = useState({
        timestamp: '00:00',
        content: '',
        type: 'note' as 'note' | 'highlight',
    });

    const downloadText = (filename: string, text: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleResourceDownload = (resourceId: number) => {
        const resource = resources.find((r) => r.id === resourceId);
        if (!resource) return;
        setResources((prev) => prev.map((r) => (r.id === resourceId ? { ...r, downloaded: true } : r)));
        const safeName = resource.title.replace(/\s+/g, '-').toLowerCase();
        downloadText(`${safeName}.txt`, `${resource.title}\n${resource.type} • ${resource.size}`);
    };

    const resolvedCourseId = courseId || '1';

    const lesson = {
        id: lessonId || '1',
        title: 'Introduction to Machine Learning Algorithms',
        description: 'In this lesson, we will explore the fundamental concepts of machine learning algorithms and their applications.',
        duration: '45:30',
        progress: 65,
        videoUrl: '/api/placeholder/video',
        transcript: `Welcome to this lesson on machine learning algorithms. Today we'll cover:

1. Supervised Learning
   - Classification algorithms
   - Regression techniques
   - Decision trees and random forests

2. Unsupervised Learning
   - Clustering methods
   - Dimensionality reduction
   - Association rules

3. Reinforcement Learning
   - Q-learning
   - Policy gradients
   - Deep reinforcement learning

Let's start with supervised learning...`,
        resources,
        notes
    };

    const relatedLessons = [
        {
            id: 1,
            title: 'Data Preprocessing Techniques',
            duration: '38:20',
            completed: true
        },
        {
            id: 2,
            title: 'Model Evaluation Metrics',
            duration: '42:15',
            completed: false
        },
        {
            id: 3,
            title: 'Feature Engineering',
            duration: '35:45',
            completed: false
        }
    ];

    const { prevLessonId, nextLessonId } = useMemo(() => {
        const ids = relatedLessons.map((l) => String(l.id));
        const current = String(lesson.id);
        const idx = ids.indexOf(current);
        const prevId = idx > 0 ? ids[idx - 1] : ids[ids.length - 1] || current;
        const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : ids[0] || current;
        return { prevLessonId: prevId, nextLessonId: nextId };
    }, [lesson.id, relatedLessons]);

    const goToLesson = (targetLessonId: string) => {
        navigate(ROUTES.LEARN.replace(':courseId', resolvedCourseId).replace(':lessonId', targetLessonId));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[36px] font-bold text-gray-900">{lesson.title}</h1>
                        <p className="text-[18px] text-gray-600 mt-1">{lesson.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-[16px]">{lesson.duration}</span>
                        </div>
                        <Button variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Video Player */}
                    <div className="lg:col-span-3">
                        <Card variant="elevated">
                            <CardContent className="p-0">
                                <div className="relative">
                                    <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Play className="w-8 h-8 ml-1" />
                                            </div>
                                            <p className="text-lg">Video Player</p>
                                            <p className="text-sm text-gray-300">Click to play lesson</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
                                        <div className="w-full bg-gray-600 rounded-full h-1 mb-2">
                                            <div
                                                className="bg-blue-600 h-1 rounded-full"
                                                style={{ width: `${lesson.progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between text-white text-sm">
                                            <span>12:30 / {lesson.duration}</span>
                                            <div className="flex items-center gap-2">
                                                <button className="hover:bg-white hover:bg-opacity-20 p-1 rounded">
                                                    <Volume2 className="w-4 h-4" />
                                                </button>
                                                <button className="hover:bg-white hover:bg-opacity-20 p-1 rounded">
                                                    <Maximize className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Video Controls */}
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <Button variant="outline" size="lg" onClick={() => goToLesson(prevLessonId)}>
                                <ChevronLeft className="w-5 h-5 mr-2" />
                                Previous
                            </Button>
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                <Play className="w-5 h-5 mr-2" />
                                Play
                            </Button>
                            <Button variant="outline" size="lg" onClick={() => goToLesson(nextLessonId)}>
                                Next
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Resources */}
                        <Card variant="elevated">
                            <CardHeader>
                                <h2 className="text-[20px] font-bold text-gray-900">Resources</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {lesson.resources.map((resource) => (
                                        <div key={resource.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-5 h-5 text-gray-600" />
                                                <div>
                                                    <p className="text-[14px] font-medium text-gray-900">{resource.title}</p>
                                                    <p className="text-[12px] text-gray-600">{resource.type} • {resource.size}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={resource.downloaded ? "outline" : "primary"}
                                                size="sm"
                                                onClick={() => handleResourceDownload(resource.id)}
                                            >
                                                {resource.downloaded ? 'Downloaded' : 'Download'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card variant="elevated">
                            <CardHeader>
                                <h2 className="text-[20px] font-bold text-gray-900">My Notes</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {lesson.notes.map((note) => (
                                        <div key={note.id} className="p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] text-blue-600 font-medium">{note.timestamp}</span>
                                                <span className={`text-[12px] px-2 py-1 rounded-full ${note.type === 'highlight' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {note.type}
                                                </span>
                                            </div>
                                            <p className="text-[14px] text-gray-700">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    fullWidth
                                    className="mt-4"
                                    onClick={() => {
                                        setNoteForm({ timestamp: '00:00', content: '', type: 'note' });
                                        setIsNoteModalOpen(true);
                                    }}
                                >
                                    Add Note
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Related Lessons */}
                        <Card variant="elevated">
                            <CardHeader>
                                <h2 className="text-[20px] font-bold text-gray-900">Related Lessons</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {relatedLessons.map((relatedLesson) => (
                                        <div
                                            key={relatedLesson.id}
                                            onClick={() => goToLesson(String(relatedLesson.id))}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {relatedLesson.completed ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                                )}
                                                <div>
                                                    <p className="text-[14px] font-medium text-gray-900">{relatedLesson.title}</p>
                                                    <p className="text-[12px] text-gray-600">{relatedLesson.duration}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Transcript */}
                <Card variant="elevated">
                    <CardHeader>
                        <h2 className="text-[24px] font-bold text-gray-900">Transcript</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-[16px] text-gray-700 whitespace-pre-line leading-relaxed">
                                {lesson.transcript}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isNoteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[18px] font-bold text-gray-900">Add Note</h2>
                                <p className="text-[14px] text-gray-600">Save a note for this lesson.</p>
                            </div>
                            <button
                                onClick={() => setIsNoteModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">Timestamp</label>
                                    <input
                                        value={noteForm.timestamp}
                                        onChange={(e) => setNoteForm((p) => ({ ...p, timestamp: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-2">Type</label>
                                    <select
                                        value={noteForm.type}
                                        onChange={(e) => setNoteForm((p) => ({ ...p, type: e.target.value as any }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="note">Note</option>
                                        <option value="highlight">Highlight</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-2">Content</label>
                                <textarea
                                    rows={4}
                                    value={noteForm.content}
                                    onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (!noteForm.content.trim()) return;
                                        const nextId = Math.max(0, ...notes.map((n) => n.id)) + 1;
                                        setNotes((prev) => [
                                            ...prev,
                                            {
                                                id: nextId,
                                                timestamp: noteForm.timestamp,
                                                content: noteForm.content.trim(),
                                                type: noteForm.type as any,
                                            },
                                        ]);
                                        setIsNoteModalOpen(false);
                                    }}
                                    disabled={!noteForm.content.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
