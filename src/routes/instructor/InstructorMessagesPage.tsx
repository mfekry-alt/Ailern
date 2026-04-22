import { useState } from 'react';
import { Send, Search, MoreVertical } from 'lucide-react';

export const InstructorMessagesPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(1);

    const conversations: { id: number; student: string; course: string; lastMessage: string; time: string; unread: boolean }[] = [];

    const messages: { id: number; sender: string; text: string; time: string; isMe: boolean }[] = [];

    return (
        <div className="px-48 py-8 max-w-[1920px] mx-auto bg-gray-50 dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-bold text-[30px] leading-[36px] text-azure-8 dark:text-zinc-100 mb-2">Messages</h1>
                <p className="text-[16px] text-azure-46 dark:text-zinc-400">Communicate with your students</p>
            </div>

            <div className="grid grid-cols-3 gap-6 h-[calc(100vh-280px)]">
                {/* Conversations List */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex flex-col">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#21A9FF] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`p-4 border-b border-gray-100 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 ${selectedConversation === conv.id ? 'bg-[#21A9FF]/10' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#21A9FF]/10 flex items-center justify-center shrink-0">
                                        <span className="text-[14px] font-semibold text-[#21A9FF]">
                                            {conv.student.split(' ').map((n) => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[14px] font-semibold text-azure-8 dark:text-zinc-100">{conv.student}</p>
                                            {conv.unread && (
                                                <span className="w-2 h-2 rounded-full bg-[#21A9FF] shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[12px] text-azure-46 dark:text-zinc-400 mb-1">{conv.course}</p>
                                        <p className="text-[12px] text-azure-46 dark:text-zinc-400 truncate">{conv.lastMessage}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">{conv.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message View */}
                <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#21A9FF]/10 flex items-center justify-center">
                                <span className="text-[14px] font-semibold text-[#21A9FF]">—</span>
                            </div>
                            <div>
                                <p className="text-[16px] font-semibold text-azure-8 dark:text-zinc-100">Select a conversation</p>
                                <p className="text-[12px] text-azure-46 dark:text-zinc-400">No conversation selected</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md">
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
                                        ? 'bg-[#21A9FF] text-white'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-azure-8 dark:text-zinc-100'
                                        }`}
                                >
                                    <p className="text-[14px]">{message.text}</p>
                                    <p
                                        className={`text-[10px] mt-2 ${message.isMe ? 'text-white/70' : 'text-gray-500'
                                            }`}
                                    >
                                        {message.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#21A9FF] bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                            />
                            <button className="px-6 py-3 bg-[#21A9FF] text-white rounded-lg hover:bg-[#0094F2] transition-colors">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

