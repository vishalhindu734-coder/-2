import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppUser, Contact, ChatRoom, ChatMessage, Attachment, MessageReference, CustomList } from '../types';
import { EventModel } from '../App';
import { ArrowLeft, Send, Users, User, Plus, MessageSquare, Paperclip, Link, X, FileText, CalendarDays, LayoutList, Check, CheckCheck } from 'lucide-react';
import { collection, addDoc, doc, setDoc, updateDoc, arrayUnion, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ChatViewProps {
  appUser: AppUser | null;
  contacts: Contact[];
  events?: EventModel[];
  customLists?: CustomList[];
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ appUser, contacts, events = [], customLists = [], onBack }) => {
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

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [reference, setReference] = useState<MessageReference | null>(null);
  const [showRefMenu, setShowRefMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatMessages.forEach(msg => {
      if (msg.senderId === myUserId) return;
      
      const isDelivered = (msg.deliveredTo || []).includes(myUserId);
      const isRead = (msg.readBy || []).includes(myUserId);
      const shouldMarkRead = activeRoomId === msg.roomId;
      
      if (!isDelivered || (shouldMarkRead && !isRead)) {
        const room = chatRooms.find(r => r.id === msg.roomId);
        if (!room) return;

        const updates: any = {};
        if (!isDelivered) updates.deliveredTo = arrayUnion(myUserId);
        if (shouldMarkRead && !isRead) updates.readBy = arrayUnion(myUserId);

        updateDoc(doc(db, 'chatMessages', msg.id), updates).catch(() => {});
      }
    });
  }, [chatMessages, activeRoomId, myUserId, chatRooms]);

  const getMessageStatus = (msg: ChatMessage, room: ChatRoom) => {
    const others = room.participantIds.filter(id => id !== myUserId);
    if (others.length === 0) return 'read';
    const readByAll = others.every(id => (msg.readBy || []).includes(id));
    if (readByAll) return 'read';
    const deliveredToAll = others.every(id => (msg.deliveredTo || []).includes(id) || (msg.readBy || []).includes(id));
    if (deliveredToAll) return 'delivered';
    return 'sent';
  };

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

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    
    if (file.size > 500 * 1024) {
      alert("Please select a file under 500KB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        type: isImage ? 'image' : 'file',
        url: event.target?.result as string,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment && !reference) || !activeRoomId) return;

    try {
      const room = chatRooms.find(r => r.id === activeRoomId);
      if (!room) return;

      let msgText = newMessage.trim();
      let lastMsgPreview = msgText;
      if (!lastMsgPreview) {
        if (attachment) lastMsgPreview = attachment.type === 'image' ? '📷 Image' : '📎 File';
        else if (reference) lastMsgPreview = `🔗 ${reference.name}`;
      }

      const msgData: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        roomId: activeRoomId,
        senderId: myUserId,
        senderName: myUserName,
        text: msgText,
        timestamp: new Date().toISOString(),
        participantIds: room.participantIds,
        ...(attachment && { attachment }),
        ...(reference && { reference })
      };
      
      await setDoc(doc(db, 'chatMessages', msgData.id), msgData);
      
      const roomRef = doc(db, 'chatRooms', activeRoomId);
      await setDoc(roomRef, {
        lastMessage: lastMsgPreview,
        lastMessageTime: msgData.timestamp,
        lastSenderId: myUserId
      }, { merge: true });

      setNewMessage('');
      setAttachment(null);
      setReference(null);
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
  
  const currentMessages = chatMessages.filter(m => m.roomId === activeRoomId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  if (activeRoomId) {
    const room = chatRooms.find(r => r.id === activeRoomId);

    let roomName = room?.name || 'Chat';
    let otherUser: AppUser | undefined = undefined;
    if (room?.type === 'direct') {
      const otherId = room.participantIds.find(id => id !== myUserId);
      otherUser = appUsers.find(u => u.uid === otherId);
      const linkedContact = otherUser?.linkedContactId ? contacts.find(c => c.id === otherUser.linkedContactId) : null;
      roomName = linkedContact?.name || otherUser?.displayName || otherUser?.email || otherId || 'Chat';
    }

    const formatLastSeen = (isoString?: string) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      return d.toLocaleDateString() === new Date().toLocaleDateString() ? `today at ${d.toLocaleTimeString([], {timeStyle: 'short'})}` : `on ${d.toLocaleDateString()}`;
    };

    return (
      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col h-full bg-white dark:bg-gray-900 absolute inset-0 z-50">
        <header className="bg-[#FF9933] text-white p-3 shadow-md flex items-center gap-2">
          <button onClick={() => setActiveRoomId(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
             {room?.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1 ml-1 text-left">
            <h2 className="font-bold text-[16px] leading-tight truncate">{roomName}</h2>
            {room?.type === 'direct' && otherUser && (
              <div className="text-[11px] text-white/80 shrink-0 truncate">
                {otherUser.isOnline ? 'Online' : otherUser.lastSeen ? `Last seen ${formatLastSeen(otherUser.lastSeen)}` : 'Offline'}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800 relative">
          {currentMessages.map((m, idx) => {
            const isMe = m.senderId === myUserId;
            return (
              <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${isMe ? 'bg-[#FF9933] text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'}`}>
                  {!isMe && room?.type === 'group' && <div className="text-xs font-bold mb-1 opacity-70">{m.senderName}</div>}
                  
                  {m.reference && (
                    <div className={`flex items-center gap-2 p-2 rounded mb-2 text-sm ${isMe ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {m.reference.type === 'contact' ? <User size={14} /> : m.reference.type === 'event' ? <CalendarDays size={14} /> : <LayoutList size={14} />}
                      <span className="truncate font-medium">{m.reference.name}</span>
                    </div>
                  )}

                  {m.attachment && m.attachment.type === 'image' && (
                    <img src={m.attachment.url} alt="attached" className="max-w-full rounded-lg mb-2 object-contain" style={{ maxHeight: '200px' }} />
                  )}
                  {m.attachment && m.attachment.type === 'file' && (
                    <div className={`flex items-center gap-2 p-2 rounded mb-2 text-sm ${isMe ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <FileText size={16} />
                      <span className="truncate">{m.attachment.name}</span>
                    </div>
                  )}

                  {m.text && <div>{m.text}</div>}
                  <div className={`text-[10px] text-right mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && room && (
                      <span className="inline-block mt-[1px]">
                        {getMessageStatus(m, room) === 'read' ? (
                          <CheckCheck size={14} className="text-blue-300" />
                        ) : getMessageStatus(m, room) === 'delivered' ? (
                          <CheckCheck size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] text-sm relative">
          {showRefMenu && (
            <div className="absolute bottom-[100%] left-0 w-full bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-2 shadow-lg z-10 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="font-bold text-xs uppercase text-gray-500">Attach Reference</span>
                <button onClick={() => setShowRefMenu(false)}><X size={16} className="text-gray-400"/></button>
              </div>
              <div className="space-y-1">
                {contacts.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => { setReference({type: 'contact', id: c.id, name: c.name}); setShowRefMenu(false); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2">
                    <User size={14} className="text-blue-500"/><span className="truncate dark:text-gray-200">{c.name}</span>
                  </button>
                ))}
                {events.slice(0, 5).map(e => (
                  <button key={e.id} onClick={() => { setReference({type: 'event', id: e.id, name: e.name}); setShowRefMenu(false); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2">
                    <CalendarDays size={14} className="text-orange-500"/><span className="truncate dark:text-gray-200">{e.name}</span>
                  </button>
                ))}
                {customLists.slice(0, 5).map(l => (
                  <button key={l.id} onClick={() => { setReference({type: 'list', id: l.id, name: l.name}); setShowRefMenu(false); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2">
                    <LayoutList size={14} className="text-purple-500"/><span className="truncate dark:text-gray-200">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3">
            {(attachment || reference) && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {attachment && (
                  <div className="flex items-center gap-2 p-1.5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                    {attachment.type === 'image' ? <span className="text-blue-500">📷</span> : <FileText size={12} className="text-blue-500" />}
                    <span className="truncate max-w-[100px] dark:text-gray-300">{attachment.name}</span>
                    <button onClick={() => setAttachment(null)}><X size={12} className="text-gray-500 hover:text-red-500"/></button>
                  </div>
                )}
                {reference && (
                  <div className="flex items-center gap-2 p-1.5 px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                    <Link size={12} />
                    <span className="truncate max-w-[100px]">{reference.name}</span>
                    <button onClick={() => setReference(null)}><X size={12} className="hover:text-red-500"/></button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-full shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAttachment} className="hidden" accept="image/*,.pdf,.doc,.docx" />
              
              <button type="button" onClick={() => setShowRefMenu(!showRefMenu)} className={`p-2 rounded-full shrink-0 ${showRefMenu ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800'}`}>
                <Link className="w-5 h-5" />
              </button>

              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Message..." 
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#FF9933]/50 dark:text-white min-w-0"
              />
              <button type="submit" disabled={!newMessage.trim() && !attachment && !reference} className="bg-[#FF9933] text-white p-2.5 rounded-full disabled:opacity-50 hover:bg-[#e68a2e] transition-colors shrink-0">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
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
