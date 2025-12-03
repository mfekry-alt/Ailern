import { useState } from 'react';
import { Send, Search, MoreVertical } from 'lucide-react';

export const InstructorMessagesPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(1);

    const conversations = [
        {
            id: 1,
            student: 'John Doe',
            course: 'CS101',
            lastMessage: 'Thank you for the feedback on my assignment!',
            time: '2h ago',
            unread: true,
        },
        {
            id: 2,
            student: 'Jane Smith',
            course: 'CS202',
            lastMessage: 'When will the grades be posted?',
            time: '5h ago',
            unread: false,
        },
        {
            id: 3,
            student: 'Bob Johnson',
            course: 'MA203',
            lastMessage: 'Could you explain the matrix concept again?',
            time: '1d ago',
            unread: false,
        },
    ];

    const messages = [
        {
            id: 1,
            sender: 'John Doe',
            text: 'Hi Professor, I have a question about the assignment.',
            time: '3h ago',
            isMe: false,
        },
        {
            id: 2,
            sender: 'Me',
            text: 'Sure, what would you like to know?',
            time: '2h ago',
            isMe: true,
        },
        {
            id: 3,
            sender: 'John Doe',
            text: 'Thank you for the feedback on my assignment!',
            time: '2h ago',
            isMe: false,
        },
    ];

    return (
        <div className="px-48 py-8 max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-bold text-[30px] leading-[36px] text-azure-8 mb-2">Messages</h1>
                <p className="text-[16px] text-azure-46">Communicate with your students</p>
            </div>

            <div className="grid grid-cols-3 gap-6 h-[calc(100vh-280px)]">
                {/* Conversations List */}
                <div className="bg-white rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex flex-col">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedConversation === conv.id ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[14px] font-semibold text-azure-50">
                                            {conv.student.split(' ').map((n) => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[14px] font-semibold text-azure-8">{conv.student}</p>
                                            {conv.unread && (
                                                <span className="w-2 h-2 rounded-full bg-azure-50 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[12px] text-azure-46 mb-1">{conv.course}</p>
                                        <p className="text-[12px] text-azure-46 truncate">{conv.lastMessage}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{conv.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message View */}
                <div className="col-span-2 bg-white rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-[14px] font-semibold text-azure-50">JD</span>
                            </div>
                            <div>
                                <p className="text-[16px] font-semibold text-azure-8">John Doe</p>
                                <p className="text-[12px] text-azure-46">CS101 - Introduction to Programming</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-md">
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-4 ${message.isMe
                                            ? 'bg-azure-50 text-white'
                                            : 'bg-gray-100 text-azure-8'
                                        }`}
                                >
                                    <p className="text-[14px]">{message.text}</p>
                                    <p
                                        className={`text-[10px] mt-2 ${message.isMe ? 'text-blue-100' : 'text-gray-500'
                                            }`}
                                    >
                                        {message.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-azure-50"
                            />
                            <button className="px-6 py-3 bg-azure-50 text-white rounded-lg hover:bg-azure-53 transition-colors">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

