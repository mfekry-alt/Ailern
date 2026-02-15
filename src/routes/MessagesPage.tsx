import { useState } from 'react';
import { Card, CardContent } from '@/components/ui';
import {
    Send,
    Search,
    Plus,
    MessageSquare,
    Users,
    Clock,
    Star,
    MoreVertical,
    Paperclip,
    Smile
} from 'lucide-react';

interface Message {
    id: string;
    sender: string;
    senderRole: 'Student' | 'Instructor' | 'Admin';
    recipient: string;
    subject: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    isImportant: boolean;
    attachments?: string[];
    course?: string;
}

interface Conversation {
    id: string;
    participants: string[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    course?: string;
}

export const MessagesPage = () => {
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [showCompose, setShowCompose] = useState(false);

    const conversations: Conversation[] = [];

    const messages: Message[] = [];

    const filteredConversations = conversations.filter(conv =>
        conv.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.course?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentMessages = selectedConversation ?
        messages.filter(msg => msg.course === conversations.find(c => c.id === selectedConversation)?.course) :
        [];

    const stats = [
        { label: 'Total Messages', value: '0', icon: MessageSquare, color: 'text-blue-600' },
        { label: 'Unread', value: '0', icon: Clock, color: 'text-yellow-600' },
        { label: 'Important', value: '0', icon: Star, color: 'text-red-600' },
        { label: 'Conversations', value: '0', icon: Users, color: 'text-green-600' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[30px] font-bold leading-[36px] text-gray-900 dark:text-zinc-100">
                            Messages
                        </h1>
                        <p className="text-[16px] leading-[24px] text-gray-600 dark:text-zinc-400 mt-1">
                            Communicate with instructors and fellow students
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCompose(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Message
                    </button>
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
                                            <p className="text-[14px] font-medium text-gray-600 dark:text-zinc-400 mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-[24px] font-bold text-gray-900 dark:text-zinc-100">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Conversations List */}
                    <div className="lg:col-span-1">
                        <Card variant="elevated">
                            <CardContent className="p-0">
                                {/* Search */}
                                <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                        />
                                    </div>
                                </div>

                                {/* Conversations */}
                                <div className="max-h-[600px] overflow-y-auto">
                                    {filteredConversations.map((conversation) => (
                                        <div
                                            key={conversation.id}
                                            onClick={() => setSelectedConversation(conversation.id)}
                                            className={`p-4 border-b border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${selectedConversation === conversation.id ? 'bg-blue-50 dark:bg-zinc-800 border-blue-200 dark:border-blue-800' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                                                        {conversation.participants.join(', ')}
                                                    </h3>
                                                    {conversation.course && (
                                                        <p className="text-[12px] text-blue-600 mb-1">
                                                            {conversation.course}
                                                        </p>
                                                    )}
                                                </div>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-gray-600 dark:text-zinc-400 mb-1 line-clamp-2">
                                                {conversation.lastMessage}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {conversation.lastMessageTime}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Messages */}
                    <div className="lg:col-span-2">
                        <Card variant="elevated">
                            <CardContent className="p-0">
                                {selectedConversation ? (
                                    <>
                                        {/* Messages Header */}
                                        <div className="p-4 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">
                                                        {conversations.find(c => c.id === selectedConversation)?.participants.join(', ')}
                                                    </h2>
                                                    <p className="text-[12px] text-gray-600 dark:text-zinc-400">
                                                        {conversations.find(c => c.id === selectedConversation)?.course}
                                                    </p>
                                                </div>
                                                <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Messages List */}
                                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                                            {currentMessages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${message.senderRole === 'Student' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] ${message.senderRole === 'Student' ? 'order-2' : 'order-1'}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[12px] font-medium text-gray-900 dark:text-zinc-100">
                                                                {message.sender}
                                                            </span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${message.senderRole === 'Instructor' ? 'bg-green-100 text-green-800' :
                                                                message.senderRole === 'Student' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-purple-100 text-purple-800'
                                                                }`}>
                                                                {message.senderRole}
                                                            </span>
                                                            {message.isImportant && (
                                                                <Star className="w-3 h-3 text-yellow-500" />
                                                            )}
                                                        </div>
                                                        <div className={`p-3 rounded-lg ${message.senderRole === 'Student'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100'
                                                            }`}>
                                                            <p className="text-[14px] leading-relaxed">
                                                                {message.content}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            {new Date(message.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Message Input */}
                                        <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <textarea
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="Type your message..."
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 resize-none"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                                                        <Paperclip className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                                                        <Smile className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                                                    </button>
                                                    <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 text-center">
                                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                                            Select a conversation
                                        </h3>
                                        <p className="text-gray-600 dark:text-zinc-400">
                                            Choose a conversation from the list to start messaging
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Compose Modal */}
                {showCompose && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100">
                                        Compose Message
                                    </h2>
                                    <button
                                        onClick={() => setShowCompose(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        To
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter recipient name or email..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter message subject..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        Course (Optional)
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
                                        <option value="">Select a course...</option>
                                        <option value="CS101">CS101 - Introduction to Programming</option>
                                        <option value="CS202">CS202 - Data Structures</option>
                                        <option value="MA203">MA203 - Linear Algebra</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        placeholder="Type your message..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 resize-none"
                                        rows={6}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowCompose(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
