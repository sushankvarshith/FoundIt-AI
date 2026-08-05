import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlinePaperAirplane, HiOutlineArrowLeft } from 'react-icons/hi';
import { messageService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { format, isToday, isYesterday } from 'date-fns';

const formatMessageTime = (dateStr) => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(searchParams.get('to') || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const itemId = searchParams.get('item') || null;

  useEffect(() => {
    messageService.getConversations()
      .then(res => setConversations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeUserId) {
      messageService.getConversation(activeUserId)
        .then(res => setMessages(res.data))
        .catch(() => {});
    }
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeUserId) return;
    setSending(true);
    try {
      const data = { receiver_id: activeUserId, content: newMessage };
      if (itemId) data.item_id = itemId;
      await messageService.send(data);
      setNewMessage('');
      const res = await messageService.getConversation(activeUserId);
      setMessages(res.data);
    } catch {} finally { setSending(false); }
  };

  const activeConv = conversations.find(c => c.other_user_id === activeUserId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-6">💬 Messages</h1>

        <div className="glass-card overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full relative">
            {/* Conversation List */}
            <div className={`w-full sm:w-80 border-r border-slate-200 dark:border-slate-700 overflow-y-auto ${activeUserId ? 'hidden sm:block' : 'block'}`}>
              {loading ? (
                <div className="p-4 space-y-3"><Skeleton variant="card" className="h-16" count={4} /></div>
              ) : conversations.length > 0 ? (
                conversations.map(conv => (
                  <button
                    key={conv.other_user_id}
                    onClick={() => setActiveUserId(conv.other_user_id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeUserId === conv.other_user_id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-3 border-l-primary-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {conv.other_user_avatar ? (
                        <img src={conv.other_user_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        conv.other_user_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{conv.other_user_name}</p>
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">{conv.unread_count}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{conv.content}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-slate-400">No conversations yet</div>
              )}
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!activeUserId ? 'hidden sm:flex' : 'flex'} absolute inset-0 sm:relative sm:inset-auto bg-white dark:bg-[#0b1120]`}>
              {activeUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <button 
                      onClick={() => setActiveUserId(null)} 
                      className="sm:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <HiOutlineArrowLeft size={20} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                      {activeConv?.other_user_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{activeConv?.other_user_name || 'User'}</span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.sender_id === user.id
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md'
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${msg.sender_id === user.id ? 'text-white/70' : 'text-slate-400'}`}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                      >
                        <HiOutlinePaperAirplane size={18} className="rotate-90" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-400">Select a conversation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
