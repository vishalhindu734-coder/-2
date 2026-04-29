import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppUser, Contact, ChatRoom, ChatMessage } from '../types';
import { ArrowLeft, Send, Users, User, Plus, MessageSquare } from 'lucide-react';
import { collection, addDoc, doc, setDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ChatViewProps {
  appUser: AppUser | null;
  contacts: Contact[];
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ appUser, contacts, onBack }) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  const myUserId = appUser?.uid || 'anonymous';
  const myUserName = appUser?.displayName || appUser?.email || 'Anonymous';
  const userRooms = chatRooms;

  // Fetch Users
  useEffect(() => {
    if (!myUserId || myUserId === 'anonymous') return;
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setAppUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
    }, err => console.error(err));
    return () => unsub();
  }, [myUserId]);

  // Fetch Rooms
  useEffect(() => {
    if (!myUserId || myUserId === 'anonymous') return;
    const q = query(collection(db, 'chatRooms'), where('participantIds', 'array-contains', myUserId));
    const unsub = onSnapshot(q, (snap) => {
      setChatRooms(snap.docs.map(d => d.data() as ChatRoom));
    }, err => handleFirestoreError(err, OperationType.LIST, 'chatRooms'));
    return () => unsub();
  }, [myUserId]);

  // Fetch Messages for active room
  useEffect(() => {
    if (!activeRoomId || !myUserId || myUserId === 'anonymous') return;
    const q = query(
      collection(db, 'chatMessages'), 
      where('roomId', '==', activeRoomId),
      where('participantIds', 'array-contains', myUserId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(d => d.data() as ChatMessage).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    }, err => handleFirestoreError(err, OperationType.LIST, 'chatMessages'));
    return () => unsub();
  }, [activeRoomId, myUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    try {
      const room = chatRooms.find(r => r.id === activeRoomId);
      if (!room) return;

      const msgData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        roomId: activeRoomId,
        senderId: myUserId,
        senderName: myUserName,
        text: newMessage,
        timestamp: new Date().toISOString(),
        participantIds: room.participantIds // Important for security rule!
      };
      
      await setDoc(doc(db, 'chatMessages', msgData.id), msgData);
      
      const roomRef = doc(db, 'chatRooms', activeRoomId);
      await setDoc(roomRef, {
        lastMessage: newMessage,
        lastMessageTime: msgData.timestamp
      }, { merge: true });

      setNewMessage('');
    } catch(err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedContacts.length === 0) return;
    try {
      const roomId = `room_${Date.now()}`;
      const participants = [myUserId, ...selectedContacts];
      await setDoc(doc(db, 'chatRooms', roomId), {
        id: roomId,
        type: 'group',
        name: newGroupName,
        participantIds: participants,
        lastMessage: 'Group created',
        lastMessageTime: new Date().toISOString()
      });
      setIsCreatingGroup(false);
      setNewGroupName('');
      setSelectedContacts([]);
    } catch(err) {
      console.error(err);
    }
  };

  const startDirectChat = async (targetUserId: string) => {
    const existing = chatRooms.find(r => r.type === 'direct' && r.participantIds.includes(myUserId) && r.participantIds.includes(targetUserId));
    if (existing) {
      setActiveRoomId(existing.id);
    } else {
      const roomId = `room_${myUserId}_${targetUserId}`;
      await setDoc(doc(db, 'chatRooms', roomId), {
        id: roomId,
        type: 'direct',
        participantIds: [myUserId, targetUserId],
        lastMessage: 'Chat started',
        lastMessageTime: new Date().toISOString()
      });
      setActiveRoomId(roomId);
    }
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  if (activeRoomId) {
    const room = chatRooms.find(r => r.id === activeRoomId);

    const messages = chatMessages.filter(m => m.roomId === activeRoomId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    let roomName = room?.name || 'Chat';
    if (room?.type === 'direct') {
      const otherId = room.participantIds.find(id => id !== myUserId);
      const otherUser = appUsers.find(u => u.uid === otherId);
      const linkedContact = otherUser?.linkedContactId ? contacts.find(c => c.id === otherUser.linkedContactId) : null;
      roomName = linkedContact?.name || otherUser?.displayName || otherUser?.email || otherId || 'Chat';
    }

    return (
      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col h-full bg-white dark:bg-gray-900 absolute inset-0 z-50">
        <header className="bg-[#FF9933] text-white p-4 shadow-md flex items-center gap-3">
          <button onClick={() => setActiveRoomId(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
             {room?.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <h2 className="font-bold text-lg">{roomName}</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
          {messages.map((m, idx) => {
            const isMe = m.senderId === myUserId;
            return (
              <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-[#FF9933] text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'}`}>
                  {!isMe && room?.type === 'group' && <div className="text-xs font-bold mb-1 opacity-70">{m.senderName}</div>}
                  <div>{m.text}</div>
                  <div className={`text-[10px] text-right mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Message..." 
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF9933]/50 dark:text-white"
            />
            <button type="submit" disabled={!newMessage.trim()} className="bg-[#FF9933] text-white p-3 rounded-full disabled:opacity-50 hover:bg-[#e68a2e] transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
       <header className="bg-white dark:bg-gray-800 p-4 shadow-sm relative sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full md:hidden">
              <ArrowLeft className="w-5 h-5 dark:text-white" />
            </button>
            <h1 className="text-xl font-bold dark:text-white">Messages</h1>
          </div>
          <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="bg-[#FF9933]/10 text-[#FF9933] p-2 rounded-full hover:bg-[#FF9933]/20 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
       </header>

       {isCreatingGroup && (
         <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 shadow-inner">
           <h3 className="font-bold mb-3 dark:text-white">Create Group</h3>
           <input 
             type="text" 
             value={newGroupName}
             onChange={e => setNewGroupName(e.target.value)}
             placeholder="Group Name" 
             className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
           />
           <div className="max-h-40 overflow-y-auto mb-3 border dark:border-gray-700 rounded select-none">
             {contacts.map(c => (
               <label key={c.id} className="flex items-center p-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={selectedContacts.includes(c.id)}
                   onChange={(e) => {
                     if (e.target.checked) setSelectedContacts([...selectedContacts, c.id]);
                     else setSelectedContacts(selectedContacts.filter(id => id !== c.id));
                   }}
                   className="mr-3"
                 />
                 <span className="dark:text-white">{c.name}</span>
               </label>
             ))}
           </div>
           <button onClick={handleCreateGroup} className="w-full bg-[#FF9933] text-white py-2 rounded-lg font-bold">Create Group</button>
         </div>
       )}

       <main className="flex-1 overflow-y-auto">
         {userRooms.length === 0 ? (
           <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p>No messages yet.</p>
              <p className="text-sm mt-2">Start a chat with your contacts below, or create a group.</p>
           </div>
         ) : (
           <div className="divide-y dark:divide-gray-800">
             {userRooms.map(room => {
               let roomName = room.name || 'Chat';
               if (room.type === 'direct') {
                 const otherId = room.participantIds.find(id => id !== myUserId);
                 const otherUser = appUsers.find(u => u.uid === otherId);
                 const linkedContact = otherUser?.linkedContactId ? contacts.find(c => c.id === otherUser.linkedContactId) : null;
                 roomName = linkedContact?.name || otherUser?.displayName || otherUser?.email || otherId || 'Chat';
               }
               return (
                 <button key={room.id} onClick={() => setActiveRoomId(room.id)} className="w-full flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 transition-colors text-left">
                   <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0">
                     {room.type === 'group' ? <Users className="w-6 h-6 text-gray-500 dark:text-gray-400" /> : <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline mb-1">
                       <h3 className="font-bold truncate dark:text-white">{roomName}</h3>
                       {room.lastMessageTime && (
                         <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                           {new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       )}
                     </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{room.lastMessage || 'Tap to chat'}</p>
                   </div>
                 </button>
               );
             })}
           </div>
         )}

         <div className="p-4">
           <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3">App Users</h3>
           <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y dark:divide-gray-800">
             {appUsers.filter(u => u.uid !== myUserId).map(u => {
               const linkedContact = u.linkedContactId ? contacts.find(c => c.id === u.linkedContactId) : null;
               const displayName = linkedContact?.name || u.displayName || u.email;
               return (
                 <button key={u.uid} onClick={() => startDirectChat(u.uid)} className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                   <div className="w-10 h-10 rounded-full bg-[#FF9933]/10 text-[#FF9933] flex items-center justify-center font-bold mr-3">
                     {displayName.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-1 flex flex-col">
                     <span className="font-medium dark:text-white">{displayName}</span>
                     {linkedContact && <span className="text-xs text-gray-500">{u.email}</span>}
                   </div>
                 </button>
               );
             })}
           </div>
         </div>
       </main>
    </div>
  );
}
