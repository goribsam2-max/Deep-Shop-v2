import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, VideoOff, Paperclip, Send, X, PhoneOff, Mic, MicOff, Volume2, Image as ImageIcon, CheckCheck, Clock, ChevronLeft, User, Search, AlertCircle, MessageSquareShare, Star, Sparkles, Plus, Users, Pin, PinOff, VolumeX, Forward, Edit, MoreVertical, Link, Info, Trash } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscribeToWebPush } from '../lib/push';
import SEO from '../components/SEO';
import { audioHelper } from '../lib/AudioHelper';
import { useNotify } from '../components/Notifications';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, collection, addDoc, getDoc, query, where, orderBy, serverTimestamp, getDocs, limit, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

const formatTime12h = (timestamp: any) => {
  if (!timestamp) return "";
  let ms = timestamp;
  if (typeof timestamp === 'object') {
    if (typeof timestamp.toMillis === 'function') {
      ms = timestamp.toMillis();
    } else if (timestamp.seconds) {
      ms = timestamp.seconds * 1000;
    } else {
      ms = Date.now();
    }
  }
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getLastActiveText = (presence: any) => {
  if (!presence) return "Offline";
  if (presence.isOnline) return "Online";
  if (!presence.lastActive) return "Offline";
  
  let lastActiveMs = 0;
  if (typeof presence.lastActive === 'number') {
    lastActiveMs = presence.lastActive;
  } else if (presence.lastActive?.toMillis) {
    lastActiveMs = presence.lastActive.toMillis();
  } else if (presence.lastActive?.seconds) {
    lastActiveMs = presence.lastActive.seconds * 1000;
  } else {
    lastActiveMs = new Date(presence.lastActive).getTime();
  }

  if (isNaN(lastActiveMs) || lastActiveMs <= 0) return "Offline";

  const diffMs = Date.now() - lastActiveMs;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Active just now";
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Active ${diffDays}d ago`;
};

const LinkPreviewCard = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match || match.length === 0) return;
    const url = match[0];
    setLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (data && (data.title || data.description || data.image)) {
          setPreview(data);
        }
      })
      .catch(err => console.error("Link preview fetch failed:", err))
      .finally(() => setLoading(false));
  }, [text]);

  if (!preview) return null;

  return (
    <a 
      href={preview.url} 
      target="_blank" 
      referrerPolicy="no-referrer"
      rel="noopener noreferrer" 
      className="mt-2 block bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm hover:opacity-90 transition-opacity max-w-sm"
    >
      {preview.image && (
        <img src={preview.image} alt={preview.title} className="w-full h-32 object-cover border-b border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
      )}
      <div className="p-3 text-left">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">{preview.domain || "Preview"}</span>
        <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1 mt-0.5">{preview.title}</h5>
        {preview.description && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-normal">{preview.description}</p>
        )}
      </div>
    </a>
  );
};

const renderTextWithLinks = (text: string, isMe?: boolean) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`underline break-all font-bold ${isMe ? 'text-white hover:text-emerald-100' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const CallBubble = ({ msg }: { msg: any }) => {
  const isVideo = msg.text?.toLowerCase().includes('video') || msg.systemType === 'video';
  const timestamp = formatTime12h(msg.timestamp);
  let icon = <Phone className="w-4 h-4 text-emerald-500" />;
  let title = "Voice Call";
  let subtitle = "Call logged";
  let bgClass = "bg-zinc-100 dark:bg-zinc-800 border-zinc-200/50 dark:border-zinc-700/50";

  if (msg.text?.includes('Missed')) {
      icon = <PhoneOff className="w-4 h-4 text-rose-500" />;
      title = "Missed Call";
      bgClass = "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20";
  } else if (isVideo) {
      icon = <Video className="w-4 h-4 text-blue-500" />;
      title = "Video Call";
  }

  return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${bgClass} w-64 my-1`}>
          <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm shrink-0">
             {icon}
          </div>
          <div className="flex-1 min-w-0">
             <p className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100">{title}</p>
             <p className="text-[11px] text-zinc-500">{subtitle}</p>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 mt-auto">{timestamp}</span>
      </div>
  );
};

export default function Messages() {
  const [user, setUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);
  const notify = useNotify();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatIdParam = searchParams.get('chatId');

  const [chats, setChats] = useState<any[]>([]);
  const [tempActiveChat, setTempActiveChat] = useState<any | null>(null);
  const [otherUserPresence, setOtherUserPresence] = useState<{ isOnline?: boolean; lastActive?: number } | null>(null);
  
  // Derived activeChat
  const activeChat = chatIdParam 
    ? (chats.find(c => c.otherUser?.id === chatIdParam) || tempActiveChat)
    : null;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Call states
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Review states
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // New States and Refs for Reactions, Replies, Review Close, and WebRTC
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; senderId: string } | null>(null);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [reviewDismissedAt, setReviewDismissedAt] = useState<number>(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Community Channel States
  const [sidebarTab, setSidebarTab] = useState<'messages' | 'community'>('messages');
  const [channels, setChannels] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('buyer');
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showChannelDetailsModal, setShowChannelDetailsModal] = useState(false);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelMessages, setChannelMessages] = useState<any[]>([]);
  const [userSubscription, setUserSubscription] = useState<any | null>(null);
  const [channelSubscribers, setChannelSubscribers] = useState<any[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  // Community Channel Creation Form Fields
  const [chanName, setChanName] = useState('');
  const [chanDesc, setChanDesc] = useState('');
  const [chanImage, setChanImage] = useState('');
  const [chanLink, setChanLink] = useState('');
  const [chanImageFile, setChanImageFile] = useState<File | null>(null);
  const [chanImagePreview, setChanImagePreview] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Edit Channel Form Fields
  const [editChanName, setEditChanName] = useState('');
  const [editChanDesc, setEditChanDesc] = useState('');
  const [editChanLink, setEditChanLink] = useState('');
  const [editChanImageFile, setEditChanImageFile] = useState<File | null>(null);
  const [editChanImagePreview, setEditChanImagePreview] = useState('');
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);

  const channelIdParam = searchParams.get('channelId');
  const activeChannel = channelIdParam ? channels.find(c => c.id === channelIdParam) : null;

  const [userShopName, setUserShopName] = useState<string>('');

  // Fetch Current User Role
  useEffect(() => {
    if (!user) return;
    const fetchUserRole = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserRole(data.role || 'buyer');
          setUserShopName(data.shopName || data.displayName || 'Seller');
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    fetchUserRole();
  }, [user]);

  // Load All Community Channels
  useEffect(() => {
    const q = query(collection(db, 'community_channels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const channelsList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setChannels(channelsList);
    }, (err) => {
      const unsub2 = onSnapshot(collection(db, 'community_channels'), (snapshot) => {
        const channelsList = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setChannels(channelsList);
      });
    });
    return () => unsub();
  }, []);

  // Fetch Active Channel Messages
  useEffect(() => {
    if (!user || !channelIdParam) {
      setChannelMessages([]);
      return;
    }

    const q = query(
      collection(db, 'community_channels', channelIdParam, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChannelMessages(msgs);
    }, (err) => {
      const unsub2 = onSnapshot(collection(db, 'community_channels', channelIdParam, 'messages'), (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
        setChannelMessages(msgs);
      });
    });

    return () => unsub();
  }, [channelIdParam, user]);

  // Fetch Current User Subscription to active channel
  useEffect(() => {
    if (!user || !channelIdParam) {
      setUserSubscription(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'community_channels', channelIdParam, 'subscriptions', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserSubscription(docSnap.data());
      } else {
        setUserSubscription(null);
      }
    });
    return () => unsub();
  }, [channelIdParam, user]);

  // Fetch Channel Subscribers for Owner Info
  useEffect(() => {
    if (!channelIdParam || !showChannelDetailsModal) {
      setChannelSubscribers([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'community_channels', channelIdParam, 'subscriptions'), (snapshot) => {
      const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChannelSubscribers(subs);
    });
    return () => unsub();
  }, [channelIdParam, showChannelDetailsModal]);

  // Init Form Fields when editing
  useEffect(() => {
    if (activeChannel) {
      setEditChanName(activeChannel.name || '');
      setEditChanDesc(activeChannel.description || '');
      setEditChanLink(activeChannel.customLink || '');
      setEditChanImagePreview(activeChannel.imageUrl || '');
    }
  }, [activeChannel, isEditingChannel]);

  const handleSubscribeToChannel = async (channel: any) => {
    if (!user) return;
    try {
      const subRef = doc(db, 'community_channels', channel.id, 'subscriptions', user.uid);
      await setDoc(subRef, {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || '',
        muted: false,
        joinedAt: Date.now()
      });
      await updateDoc(doc(db, 'community_channels', channel.id), {
        subscriberCount: (channel.subscriberCount || 0) + 1
      });
      notify(`Subscribed to ${channel.name}!`, "success");
    } catch(e) {
      console.error(e);
      notify("Failed to subscribe", "error");
    }
  };

  const handleToggleMuteChannel = async (channel: any, currentMuted: boolean) => {
    if (!user) return;
    try {
      const subRef = doc(db, 'community_channels', channel.id, 'subscriptions', user.uid);
      await updateDoc(subRef, {
        muted: !currentMuted
      });
      notify(!currentMuted ? "Channel muted" : "Channel unmuted", "info");
    } catch(e) {
      console.error(e);
      notify("Failed to update notification settings", "error");
    }
  };

  const handleUnsubscribeFromChannel = async (channel: any) => {
    if (!user) return;
    try {
      const subRef = doc(db, 'community_channels', channel.id, 'subscriptions', user.uid);
      await deleteDoc(subRef);
      await updateDoc(doc(db, 'community_channels', channel.id), {
        subscriberCount: Math.max(0, (channel.subscriberCount || 1) - 1)
      });
      notify(`Unsubscribed from ${channel.name}`, "info");
      setUserSubscription(null);
    } catch(e) {
      console.error(e);
      notify("Failed to unsubscribe", "error");
    }
  };

  const handleCreateChannel = async () => {
    if (!user) return;
    if (!chanName.trim()) {
      notify("Please enter a channel name", "error");
      return;
    }
    if (!chanLink.trim()) {
      notify("Please enter a custom link or handle", "error");
      return;
    }
    
    setIsCreatingChannel(true);
    try {
      // Check if custom link (handle) already exists
      const linkQuery = query(collection(db, 'community_channels'), where('customLink', '==', chanLink.trim().toLowerCase()));
      const linkSnap = await getDocs(linkQuery);
      if (!linkSnap.empty) {
        notify("This custom link/handle is already taken. Please choose another one.", "error");
        setIsCreatingChannel(false);
        return;
      }

      // Default cover image if none provided
      const finalImage = chanImage.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80';

      const newChannelDoc = {
        name: chanName.trim(),
        description: chanDesc.trim(),
        customLink: chanLink.trim().toLowerCase(),
        imageUrl: finalImage,
        creatorId: user.uid,
        creatorName: userShopName || user.displayName || 'Verified Seller',
        subscriberCount: 1, // creator subscribes automatically
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'community_channels'), newChannelDoc);

      // Automatically subscribe the creator
      const subRef = doc(db, 'community_channels', docRef.id, 'subscriptions', user.uid);
      await setDoc(subRef, {
        uid: user.uid,
        displayName: user.displayName || 'Verified Seller',
        photoURL: user.photoURL || '',
        muted: false,
        joinedAt: Date.now()
      });

      notify("Community Channel created successfully!", "success");
      
      // Reset fields
      setChanName('');
      setChanDesc('');
      setChanLink('');
      setChanImage('');
      setShowCreateChannelModal(false);
    } catch (err) {
      console.error("Error creating channel:", err);
      notify("Failed to create community channel", "error");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleReactToChannelMessage = async (msgId: string, emoji: string) => {
    if (!user || !channelIdParam) return;
    const msgRef = doc(db, 'community_channels', channelIdParam, 'messages', msgId);
    try {
      const msgDoc = await getDoc(msgRef);
      if (msgDoc.exists()) {
        const data = msgDoc.data();
        const currentReactions = { ...(data.reactions || {}) };
        
        if (currentReactions[user.uid] === emoji) {
          delete currentReactions[user.uid];
        } else {
          currentReactions[user.uid] = emoji;
        }
        
        await updateDoc(msgRef, { reactions: currentReactions });
      }
    } catch (err) {
      console.error("Failed to react to channel post:", err);
    }
    setActiveMessageMenuId(null);
  };

  const handlePinMessage = async (msg: any) => {
    if (!channelIdParam) return;
    try {
      await updateDoc(doc(db, 'community_channels', channelIdParam), {
        pinnedMessage: {
          id: msg.id,
          text: msg.text || "Image Attachment",
          imageUrl: msg.imageUrl || ""
        }
      });
      notify("Message pinned successfully!", "success");
    } catch (err) {
      console.error(err);
      notify("Failed to pin message", "error");
    }
  };

  const handleUnpinMessage = async () => {
    if (!channelIdParam) return;
    try {
      await updateDoc(doc(db, 'community_channels', channelIdParam), {
        pinnedMessage: null
      });
      notify("Message unpinned", "info");
    } catch (err) {
      console.error(err);
      notify("Failed to unpin message", "error");
    }
  };

  const handleSendForward = async (targetChatOrChannel: any, isChannelTarget: boolean) => {
    if (!user || !forwardingMessage) return;

    try {
      const forwardText = forwardingMessage.text;
      const forwardImg = forwardingMessage.imageUrl;
      const originalName = forwardingMessage.originalSenderName || "User";

      const msgData: any = {
        text: forwardText || "",
        imageUrl: forwardImg || null,
        senderId: user.uid,
        forwardedFrom: originalName,
        timestamp: serverTimestamp()
      };

      if (isChannelTarget) {
        await addDoc(collection(db, 'community_channels', targetChatOrChannel.id, 'messages'), msgData);
        
        fetch('/api/send-push-channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: targetChatOrChannel.id,
            title: `📢 Forwarded Post in ${targetChatOrChannel.name}`,
            body: forwardText || "Sent a forwarded image",
            link: `/messages?channelId=${targetChatOrChannel.id}`
          })
        }).catch(err => console.error("Channel push error:", err));

      } else {
        let chatId = targetChatOrChannel.id;
        if (targetChatOrChannel.isNew) {
          const chatRef = await addDoc(collection(db, 'p2p_chats'), {
            participants: [user.uid, targetChatOrChannel.otherUser.id],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: forwardText || 'Sent a forwarded image',
            lastSenderId: user.uid,
            seenBy: [user.uid]
          });
          chatId = chatRef.id;
        } else {
          await updateDoc(doc(db, 'p2p_chats', chatId), {
            updatedAt: serverTimestamp(),
            lastMessage: forwardText || 'Sent a forwarded image',
            lastSenderId: user.uid,
            seenBy: [user.uid]
          });
        }

        await addDoc(collection(db, 'p2p_chats', chatId, 'messages'), msgData);

        const recipientId = targetChatOrChannel.otherUser?.id || targetChatOrChannel.otherUser?.uid;
        if (recipientId && recipientId !== "system") {
          fetch("/api/send-push-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: recipientId,
              title: user.displayName || "New Message",
              body: `Forwarded: ${forwardText || "Sent an image"}`,
              link: `/messages?chatId=${user.uid}`
            })
          }).catch(err => console.error("Message push notification failed:", err));
        }
      }

      notify("Message forwarded successfully!", "success");
      setShowForwardModal(false);
      setForwardingMessage(null);
    } catch(err) {
      console.error(err);
      notify("Failed to forward message", "error");
    }
  };

  const handleReactToMessage = async (msgId: string, emoji: string) => {
    if (!user || !activeChat || !activeChat.id) return;
    const msgRef = doc(db, 'p2p_chats', activeChat.id, 'messages', msgId);
    try {
      const msgDoc = await getDoc(msgRef);
      if (msgDoc.exists()) {
        const data = msgDoc.data();
        const currentReactions = { ...(data.reactions || {}) };
        
        if (currentReactions[user.uid] === emoji) {
          delete currentReactions[user.uid];
        } else {
          currentReactions[user.uid] = emoji;
        }
        
        await updateDoc(msgRef, { reactions: currentReactions });
      }
    } catch (err) {
      console.error("Failed to react:", err);
    }
    setActiveMessageMenuId(null);
  };

  useEffect(() => {
    if (!user || !activeChat || !activeChat.otherUser?.id) {
      setHasReviewed(false);
      return;
    }
    
    const checkReview = async () => {
      try {
        const q = query(
          collection(db, "user_reviews"),
          where("reviewerId", "==", user.uid),
          where("revieweeId", "==", activeChat.otherUser.id)
        );
        const snap = await getDocs(q);
        setHasReviewed(!snap.empty);
      } catch (err) {
        console.error("Error checking review:", err);
      }
    };
    
    checkReview();
  }, [activeChat?.otherUser?.id, user]);

  // Effect 1: Listen for user's chats (No orderBy in query to avoid index requirements, sorted in memory)
  useEffect(() => {
    if (!user) return;
    
    const q1 = query(
      collection(db, 'p2p_chats'), 
      where('participants', 'array-contains', user.uid)
    );
    
    const unsub = onSnapshot(q1, async (snapshot) => {
        const chatsList = await Promise.all(snapshot.docs.map(async d => {
            const data = d.data();
            const otherUid = data.participants.find((p: string) => p !== user.uid);
            
            let otherUser = { displayName: 'Unknown', photoURL: '', id: otherUid };
            if (otherUid) {
                if (otherUid === 'system') {
                    otherUser = {
                        id: 'system',
                        displayName: 'Vibe Gadget HQ',
                        photoURL: ''
                    };
                } else {
                    const uDoc = await getDoc(doc(db, 'users', otherUid));
                    if (uDoc.exists()) {
                        otherUser = { ...uDoc.data(), id: uDoc.id } as any;
                    } else {
                        otherUser = {
                            id: otherUid,
                            displayName: 'Verified Seller',
                            photoURL: ''
                        };
                    }
                }
            }
            
            return {
                id: d.id,
                ...data,
                otherUser
            };
        }));

        // Sort in memory by updatedAt descending safely
        chatsList.sort((a, b) => {
          const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt || 0);
          const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt || 0);
          return tB - tA;
        });
        
        setChats(chatsList);
    });
    
    return () => unsub();
  }, [user]);

  // Effect 2: Load new user for active chat if they're not in existing chats
  useEffect(() => {
    if (!user || !chatIdParam) {
      setTempActiveChat(null);
      return;
    }

    const existingChat = chats.find(c => c.otherUser?.id === chatIdParam);
    if (existingChat) {
      setTempActiveChat(null);
      return;
    }

    const fetchTempUser = async () => {
      try {
        if (chatIdParam === "system") {
          setTempActiveChat({
            isNew: true,
            otherUser: {
              id: "system",
              displayName: "Vibe Gadget HQ",
              shopName: "Vibe Gadget HQ",
              photoURL: ""
            }
          });
        } else {
          const uDoc = await getDoc(doc(db, 'users', chatIdParam));
          if (uDoc.exists()) {
            setTempActiveChat({
              isNew: true,
              otherUser: { ...uDoc.data(), id: uDoc.id }
            });
          } else {
            setTempActiveChat({
              isNew: true,
              otherUser: {
                id: chatIdParam,
                displayName: "Verified Seller",
                shopName: "Verified Seller",
                photoURL: ""
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user for temp active chat:", err);
      }
    };

    fetchTempUser();
  }, [chatIdParam, chats, user]);

  // Effect 3: Listen for other user presence status in real-time
  useEffect(() => {
    if (!activeChat || !activeChat.otherUser?.id || activeChat.otherUser.id === 'system') {
      setOtherUserPresence(null);
      return;
    }

    const otherUid = activeChat.otherUser.id;
    const unsub = onSnapshot(doc(db, 'users', otherUid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOtherUserPresence({
          isOnline: data.isOnline || false,
          lastActive: data.lastActive || 0
        });
      }
    });

    return () => unsub();
  }, [activeChat?.otherUser?.id]);

  // Auto-trigger call if autoCall parameter is present
  useEffect(() => {
    const autoCallParam = searchParams.get('autoCall');
    if (activeChat && autoCallParam === 'true') {
      const params = new URLSearchParams(searchParams);
      params.delete('autoCall');
      setSearchParams(params, { replace: true });
      
      startCall('audio');
    }
  }, [activeChat, searchParams, setSearchParams]);

  // Effect 4: Listen for messages & set as seen
  useEffect(() => {
    if (!activeChat || activeChat.isNew || !activeChat.id) {
        setMessages([]);
        return;
    }
    
    const q = query(
      collection(db, 'p2p_chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Mark the active chat as seen by current user in real-time
      if (user && activeChat.id) {
        updateDoc(doc(db, 'p2p_chats', activeChat.id), {
          seenBy: arrayUnion(user.uid)
        }).catch(console.error);
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Request notification permission to show push notifications for new messages
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsub();
  }, [activeChat?.id, user]);

  // Effect 5: Mark chat as seen when opened
  useEffect(() => {
    if (user && activeChat && activeChat.id && !activeChat.isNew) {
      updateDoc(doc(db, 'p2p_chats', activeChat.id), {
        seenBy: arrayUnion(user.uid)
      }).catch(console.error);
    }
  }, [activeChat?.id, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify("File must be less than 5MB", "error");
        return;
      }
      setAttachment(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAttachmentChange = handleFileSelect;

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=e0b1df667ddc10816a3036a7edb7e289`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    return data.data.url;
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !user) return;

    if (activeChannel) {
      if (activeChannel.creatorId !== user.uid) return;
      
      const messageText = newMessage.trim();
      setNewMessage('');
      
      let imageUrl = null;
      if (attachment) {
        try {
          notify("Uploading image...", "info");
          imageUrl = await uploadImage(attachment);
          setAttachment(null);
          setPreviewUrl('');
        } catch (e) {
          notify("Failed to upload image", "error");
          return;
        }
      }

      try {
        const msgData: any = {
          text: messageText || null,
          imageUrl,
          senderId: user.uid,
          senderName: user.displayName || 'Seller',
          senderPhoto: user.photoURL || '',
          timestamp: serverTimestamp()
        };

        if (replyingTo) {
          msgData.replyTo = {
            id: replyingTo.id,
            text: replyingTo.text,
            senderId: replyingTo.senderId
          };
          setReplyingTo(null);
        }

        await addDoc(collection(db, 'community_channels', activeChannel.id, 'messages'), msgData);
        
        fetch('/api/send-push-channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: activeChannel.id,
            title: `📢 New Post in ${activeChannel.name}`,
            body: messageText || "Sent an image attachment",
            link: `/messages?channelId=${activeChannel.id}`
          })
        }).catch(err => console.error("Channel push error:", err));

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err) {
        console.error(err);
        notify("Failed to send community post", "error");
      }
      return;
    }

    if (!activeChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    let imageUrl = null;
    if (attachment) {
      try {
        notify("Uploading image...", "info");
        imageUrl = await uploadImage(attachment);
        setAttachment(null);
        setPreviewUrl('');
      } catch (e) {
        notify("Failed to upload image", "error");
        return;
      }
    }
    
    let chatId = activeChat.id;
    
    // If it's a new chat, create it first
    if (activeChat.isNew) {
        const chatRef = await addDoc(collection(db, 'p2p_chats'), {
            participants: [user.uid, activeChat.otherUser.id],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: messageText || 'Sent an image',
            lastSenderId: user.uid,
            seenBy: [user.uid]
        });
        chatId = chatRef.id;
        setTempActiveChat({ ...activeChat, id: chatId, isNew: false, seenBy: [user.uid] });
    } else {
        await updateDoc(doc(db, 'p2p_chats', chatId), {
            updatedAt: serverTimestamp(),
            lastMessage: messageText || 'Sent an image',
            lastSenderId: user.uid,
            seenBy: [user.uid]
        });
    }

    const msgData: any = {
      text: messageText,
      imageUrl,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    };

    if (replyingTo) {
      msgData.replyTo = {
        id: replyingTo.id,
        text: replyingTo.text,
        senderId: replyingTo.senderId
      };
      setReplyingTo(null);
    }

    await addDoc(collection(db, 'p2p_chats', chatId, 'messages'), msgData);
    
    // Send a real push notification to the recipient!
    const recipientId = activeChat.otherUser?.id || activeChat.otherUser?.uid;
    if (recipientId && recipientId !== "system") {
      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: recipientId,
          title: user.displayName || "New Message",
          body: messageText || "Sent an image",
          link: `/messages?chatId=${user.uid}`
        })
      }).catch(err => console.error("Message push notification failed:", err));
    }
    
    // Local push notification simulation for the other user receiving it (this would normally be Cloud Functions)
    if (Notification.permission === 'granted') {
        // Just for demo, we don't send notification to ourselves
    }
  };

  // --- Calling Logic (Real-time P2P) ---
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  // Sync with activeCallIdParam (if accepted from incoming call overlay)
  useEffect(() => {
    const activeCallIdParam = searchParams.get('activeCallId');
    const callTypeParam = searchParams.get('callType') as 'audio' | 'video' | null;
    if (activeCallIdParam) {
      setCurrentCallId(activeCallIdParam);
      setIsCalling(true);
      setCallStatus('connected');
      if (callTypeParam) setCallType(callTypeParam);
      
      // Clean query params so we don't trigger it again
      const params = new URLSearchParams(searchParams);
      params.delete('activeCallId');
      params.delete('callType');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams]);

  // Listen to the active call doc
  useEffect(() => {
    if (!currentCallId) return;

    const unsub = onSnapshot(doc(db, 'p2p_calls', currentCallId), (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.status === 'ringing') {
        setCallStatus('ringing');
      } else if (data.status === 'connected') {
        if (callStatus !== 'connected') {
          setCallStatus('connected');
          if (audioHelper && typeof audioHelper.stop === 'function') {
            audioHelper.stop();
          }
          setCallDuration(0);
          
          // Log start of call in chat if we are the caller
          if (data.callerId === user?.uid && activeChat && !activeChat.isNew) {
            addDoc(collection(db, 'p2p_chats', activeChat.id, 'messages'), {
              text: `Started ${data.type} call`,
              senderId: user?.uid,
              systemType: data.type,
              timestamp: Date.now()
            }).catch(console.error);
          }
        }
      } else if (data.status === 'ended') {
        setIsCalling(false);

        // Clean up WebRTC streams and peer connection
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track: any) => track.stop());
          localStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }

        if (audioHelper && typeof audioHelper.stop === 'function') {
          audioHelper.stop();
        }
        if (audioHelper && typeof audioHelper.playEndBip === 'function') {
          audioHelper.playEndBip();
        }
        
        // Log end of call in chat if we are the caller and we were connected
        if (data.callerId === user?.uid && activeChat && !activeChat.isNew && callStatus === 'connected') {
          addDoc(collection(db, 'p2p_chats', activeChat.id, 'messages'), {
            text: `${callType} call ended (${Math.floor(callDuration / 60)}m ${callDuration % 60}s)`,
            senderId: user?.uid,
            systemType: callType,
            timestamp: serverTimestamp()
          }).catch(console.error);
        }
        
        setCurrentCallId(null);
      }
    });

    return () => unsub();
  }, [currentCallId, callStatus, activeChat, user, callType, callDuration]);

  const startCall = async (type: 'audio' | 'video') => {
    if (!user || !activeChat || activeChat.isNew) {
      notify("Please open an active chat to make a call.", "error");
      return;
    }

    setCallType(type);
    setIsCalling(true);
    setCallStatus('connecting');

    if (audioHelper && typeof audioHelper.play === 'function') {
      audioHelper.play('calling');
    } else if (audioHelper && typeof audioHelper.playCalling === 'function') {
      audioHelper.playCalling();
    }

    try {
      const callRef = await addDoc(collection(db, 'p2p_calls'), {
        callerId: user.uid,
        callerName: user.displayName || 'Vibe Gadget Customer',
        callerAvatar: user.photoURL || '',
        receiverId: activeChat.otherUser.id,
        status: 'calling',
        type,
        timestamp: Date.now()
      });
      setCurrentCallId(callRef.id);

      // Send push notification to receiver!
      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeChat.otherUser?.id || activeChat.otherUser?.uid,
          title: `Incoming ${type === 'audio' ? 'Voice' : 'Video'} Call...`,
          body: `${user.displayName || 'Someone'} is calling you on Vibe Gadget.`,
          link: `/messages?chatId=${user.uid}&autoCall=true`
        })
      }).catch(err => console.error("Call push notification failed:", err));
    } catch (e) {
      console.error("Failed to start call:", e);
      setIsCalling(false);
      if (audioHelper && typeof audioHelper.stop === 'function') {
        audioHelper.stop();
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
        interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    if (activeChat?.id) {
      const val = localStorage.getItem('dismissed_review_' + activeChat.id);
      setReviewDismissedAt(val ? parseInt(val) : 0);
    }
  }, [activeChat?.id]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (!currentCallId || callStatus !== 'connected') {
      return;
    }

    let isSubscribed = true;
    let unsubCandidates1: any = null;
    let unsubCandidates2: any = null;
    let unsubCallDoc: any = null;

    const setupWebRTC = async () => {
      try {
        console.log("Setting up WebRTC connection...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video'
        });
        
        if (!isSubscribed) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setLocalStream(stream);
        localStreamRef.current = stream;

        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            console.log("Remote stream track received:", event.streams[0]);
            setRemoteStream(event.streams[0]);
            
            if (callType === 'video') {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
              }
            } else {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
              }
            }
          }
        };

        const callDocRef = doc(db, 'p2p_calls', currentCallId);
        const callSnap = await getDoc(callDocRef);
        if (!callSnap.exists()) return;
        const callData = callSnap.data();
        const isCaller = callData.callerId === user?.uid;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidateData = event.candidate.toJSON();
            const collectionName = isCaller ? 'callerCandidates' : 'receiverCandidates';
            addDoc(collection(db, 'p2p_calls', currentCallId, collectionName), candidateData)
              .catch(e => console.error("Error adding ice candidate:", e));
          }
        };

        const remoteCandidateCol = collection(db, 'p2p_calls', currentCallId, isCaller ? 'receiverCandidates' : 'callerCandidates');
        unsubCandidates1 = onSnapshot(remoteCandidateCol, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit);
              pc.addIceCandidate(candidate).catch(e => console.error("Error adding remote ice candidate:", e));
            }
          });
        });

        if (isCaller) {
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);
          
          await updateDoc(callDocRef, {
            offer: {
              type: offerDescription.type,
              sdp: offerDescription.sdp
            }
          });

          unsubCallDoc = onSnapshot(callDocRef, (snap) => {
            const data = snap.data();
            if (data && data.answer && !pc.currentRemoteDescription) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription).catch(e => console.error("Error setting remote description:", e));
            }
          });
        } else {
          if (callData.offer) {
            const offerDescription = new RTCSessionDescription(callData.offer);
            await pc.setRemoteDescription(offerDescription);
            
            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);
            
            await updateDoc(callDocRef, {
              answer: {
                type: answerDescription.type,
                sdp: answerDescription.sdp
              }
            });
          } else {
            unsubCallDoc = onSnapshot(callDocRef, async (snap) => {
              const data = snap.data();
              if (data && data.offer && !pc.currentRemoteDescription) {
                const offerDescription = new RTCSessionDescription(data.offer);
                await pc.setRemoteDescription(offerDescription);
                
                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);
                
                await updateDoc(callDocRef, {
                  answer: {
                    type: answerDescription.type,
                    sdp: answerDescription.sdp
                  }
                });
              }
            });
          }
        }
      } catch (err: any) {
        console.error("WebRTC setup error:", err);
        notify("Could not establish audio connection. Please check mic permissions.", "error");
      }
    };

    setupWebRTC();

    return () => {
      isSubscribed = false;
      if (unsubCandidates1) unsubCandidates1();
      if (unsubCandidates2) unsubCandidates2();
      if (unsubCallDoc) unsubCallDoc();
    };
  }, [currentCallId, callStatus]);

  const endCall = async () => {
    setIsCalling(false);

    // Clean up WebRTC streams and peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioHelper && typeof audioHelper.stop === 'function') {
      audioHelper.stop();
    }
    if (audioHelper && typeof audioHelper.playEndBip === 'function') {
      audioHelper.playEndBip();
    }

    if (currentCallId) {
      await updateDoc(doc(db, 'p2p_calls', currentCallId), {
        status: 'ended'
      }).catch(console.error);
      setCurrentCallId(null);
    }
  };
  
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmitReview = async () => {
    if (!user || !activeChat || !activeChat.otherUser?.id) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, "user_reviews"), {
        reviewerId: user.uid,
        reviewerName: user.displayName || user.email?.split("@")[0] || "Someone",
        reviewerPhoto: user.photoURL || "",
        revieweeId: activeChat.otherUser.id,
        rating: reviewRating,
        comment: reviewText.trim(),
        createdAt: Date.now(),
        chatId: activeChat.id || "p2p"
      });

      const reviewerName = user.displayName || "Someone";
      const revieweeName = activeChat.otherUser.displayName || activeChat.otherUser.shopName || "User";

      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeChat.otherUser.id,
          title: "New Review Received! ⭐",
          body: `${reviewerName} gave you a ${reviewRating}-star rating: "${reviewText.trim() || 'Excellent!'}"`,
          link: `/store/${activeChat.otherUser.id}`
        })
      }).catch(err => console.error("Push to reviewee failed:", err));

      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          title: "Review Submitted! 🎉",
          body: `You successfully rated ${revieweeName} ${reviewRating} Stars!`,
          link: "/messages"
        })
      }).catch(err => console.error("Push to reviewer failed:", err));

      setHasReviewed(true);
      setShowReviewModal(false);
      setReviewText("");
      notify("Review submitted successfully!", "success");
    } catch (err) {
      console.error("Error submitting review:", err);
      notify("Failed to submit review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50 dark:bg-zinc-950 font-inter">
            <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Please Sign In</h2>
            <p className="text-sm text-zinc-500 mt-2">You need to log in to access messages.</p>
            <button onClick={() => navigate('/auth-selector')} className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm">
                Sign In
            </button>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-inter overflow-hidden">
      <SEO title="Messages" description="Chat with sellers and support" noindex />
      
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-[350px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col relative ${activeChat || activeChannel ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-4 pb-2 flex items-center gap-2">
             <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition" title="Go Back">
                 <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
             </button>
             <div className="relative flex-1">
                 <input type="text" placeholder={sidebarTab === 'messages' ? "Search chats..." : "Search communities..."} className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-emerald-500/50" />
                 <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
             </div>
         </div>

         <div className="flex-1 overflow-y-auto">
             {sidebarTab === 'messages' ? (
                 chats.length === 0 && !chatIdParam ? (
                     <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center">
                         <MessageSquareShare className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
                         <p className="font-medium text-sm">No messages yet</p>
                         <p className="text-xs mt-1">Start a conversation with a seller to see it here.</p>
                     </div>
                 ) : (
                     chats.map(chat => {
                          const isUnread = chat.lastMessage && chat.lastSenderId !== user.uid && (!chat.seenBy || !chat.seenBy.includes(user.uid));
                          return (
                         <div 
                            key={chat.id} 
                            onClick={() => setSearchParams({ chatId: chat.otherUser?.id || "" })}
                            className={cn(
                                 "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                                 activeChat?.id === chat.id ? "bg-zinc-50 dark:bg-zinc-800" : ""
                             )}
                         >
                             <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                 {chat.otherUser?.photoURL ? (
                                     <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                                         {(chat.otherUser?.displayName || chat.otherUser?.shopName || 'U')[0].toUpperCase()}
                                     </div>
                                 )}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-0.5">
                                     <h4 className={cn("text-[15px] truncate", isUnread ? "font-black text-zinc-950 dark:text-white" : "font-bold text-zinc-900 dark:text-zinc-100")}>
                                         {chat.otherUser?.shopName || chat.otherUser?.displayName || 'Unknown User'}
                                     </h4>
                                     {chat.updatedAt && (
                                         <span className={cn("text-[10px]", isUnread ? "font-extrabold text-emerald-600 dark:text-emerald-400 animate-pulse" : "font-bold text-zinc-400")}>
                                             {new Date(chat.updatedAt?.toMillis ? chat.updatedAt.toMillis() : Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                         </span>
                                     )}
                                 </div>
                                 <div className="flex justify-between items-center gap-2">
                                      <p className={cn("text-[13px] truncate flex-1", isUnread ? "font-extrabold text-zinc-950 dark:text-white" : "text-zinc-500 dark:text-zinc-400")}>{chat.lastMessage}</p>
                                      {isUnread && (
                                          <span className="bg-emerald-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shrink-0">
                                              1
                                          </span>
                                      )}
                                  </div>
                             </div>
                         </div>
                      )})
                 )
             ) : (
                 <div className="flex flex-col">
                   {(userRole === 'seller' || userRole === 'admin') && (
                     <div className="p-3 border-b border-zinc-100 dark:border-zinc-850 bg-emerald-50/40 dark:bg-emerald-950/10 shrink-0">
                       <button
                         onClick={() => setShowCreateChannelModal(true)}
                         className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs shadow-md transition active:scale-95"
                       >
                         <Plus className="w-4 h-4" />
                         <span>Create Community Channel</span>
                       </button>
                     </div>
                   )}

                   {channels.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-zinc-400 p-6 text-center">
                       <Users className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
                       <p className="font-medium text-sm">No community channels yet</p>
                       <p className="text-xs mt-1">Sellers can create a new channel to post updates!</p>
                       {(userRole === 'seller' || userRole === 'admin') && (
                         <button
                           onClick={() => setShowCreateChannelModal(true)}
                           className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition"
                         >
                           Create Channel
                         </button>
                       )}
                     </div>
                   ) : (
                     channels.map(channel => {
                       const isSelected = channelIdParam === channel.id;
                       return (
                         <div
                           key={channel.id}
                           onClick={() => setSearchParams({ channelId: channel.id })}
                           className={cn(
                             "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                             isSelected ? "bg-zinc-50 dark:bg-zinc-800" : ""
                           )}
                         >
                           <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 relative">
                             <img src={channel.imageUrl} alt={channel.name} className="w-full h-full object-cover" />
                             <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                               <Sparkles className="w-2 h-2 text-white fill-white" />
                             </div>
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                               <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] truncate">
                                 {channel.name}
                               </h4>
                               <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                                 @{channel.customLink}
                               </span>
                             </div>
                             <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                               {channel.description || "Welcome to our community!"}
                             </p>
                             <div className="flex items-center gap-1.5 mt-1">
                               <span className="text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                                 {channel.subscriberCount || 1} subscribers
                               </span>
                             </div>
                           </div>
                         </div>
                       );
                     })
                   )}
                 </div>
             )}
         </div>

         {/* Floating Action Button for Sellers to Create Channels */}
         {userRole === 'seller' && (
           <button 
             onClick={() => setShowCreateChannelModal(true)}
             className="absolute bottom-20 right-4 p-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all z-20"
             title="Create Community Channel"
           >
             <Plus className="w-5 h-5" />
           </button>
         )}

         {/* Sidebar Bottom Tabs */}
         <div className="border-t border-zinc-100 dark:border-zinc-800 p-2 flex bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
              <button 
                 onClick={() => setSidebarTab('messages')} 
                 className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition ${sidebarTab === 'messages' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 font-bold' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                   <MessageSquareShare className="w-4 h-4 mb-1" />
                   <span className="text-[10px]">Chats</span>
              </button>
              <button 
                 onClick={() => setSidebarTab('community')} 
                 className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition relative ${sidebarTab === 'community' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 font-bold' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                   <Users className="w-4 h-4 mb-1" />
                   <span className="text-[10px]">Community</span>
              </button>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 bg-[#F0F2F5] dark:bg-[#0a0a0a] flex-col ${(!activeChat && !activeChannel) ? 'hidden md:flex' : 'flex'}`}>
         {activeChannel ? (
             <>
                  {/* Active Community Channel Header */}
                  <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-10 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setShowChannelDetailsModal(true)}>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSearchParams({}); }} 
                            className="md:hidden p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shrink-0"
                            title="Back to Communities"
                          >
                              <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                          </button>
                          
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                              <img src={activeChannel.imageUrl} alt={activeChannel.name} className="w-full h-full object-cover animate-fade-in" />
                          </div>
                          
                          <div className="min-w-0">
                              <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1">
                                  <span>{activeChannel.name}</span>
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />
                              </h3>
                              <p className="text-[10px] font-bold text-zinc-500 truncate flex items-center gap-1.5">
                                  <span>@{activeChannel.customLink}</span>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400">{activeChannel.subscriberCount || 1} subscribers</span>
                              </p>
                          </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                          {userSubscription ? (
                              <button 
                                type="button"
                                onClick={() => handleToggleMuteChannel(activeChannel, userSubscription.muted)} 
                                className={cn(
                                  "p-2.5 rounded-xl transition",
                                  userSubscription.muted 
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600" 
                                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                )} 
                                title={userSubscription.muted ? "Unmute Channel" : "Mute Channel"}
                              >
                                  {userSubscription.muted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                              </button>
                          ) : (
                              <button 
                                type="button"
                                onClick={() => handleSubscribeToChannel(activeChannel)} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                              >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Subscribe</span>
                              </button>
                          )}
                          
                          <button 
                            type="button"
                            onClick={() => setShowChannelDetailsModal(true)} 
                            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition" 
                            title="Channel Details"
                          >
                              <Info className="w-4.5 h-4.5" />
                          </button>
                      </div>
                  </div>

                  {activeChannel.pinnedMessage && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-zinc-900/90 dark:to-zinc-950/90 border-b border-amber-100 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs shrink-0 z-10 shadow-sm relative">
                      <div className="flex items-center gap-2 min-w-0 cursor-pointer flex-1" onClick={() => {
                        const targetMsg = channelMessages.find(m => m.id === activeChannel.pinnedMessage.id);
                        if (targetMsg) {
                          document.getElementById(`msg-${targetMsg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                          notify(`Pinned: ${activeChannel.pinnedMessage.text}`, "info");
                        }
                      }}>
                        <Pin className="w-3.5 h-3.5 text-[#EF8020] rotate-45 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-[10px] text-[#EF8020] uppercase tracking-wider">Pinned Message</p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate mt-0.5">{activeChannel.pinnedMessage.text}</p>
                        </div>
                      </div>
                      {activeChannel.creatorId === user.uid && (
                        <button 
                          type="button" 
                          onClick={handleUnpinMessage}
                          className="p-1 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 transition ml-2"
                          title="Unpin Message"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Channel Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {channelMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center">
                              <Sparkles className="w-12 h-12 mb-3 text-emerald-500 fill-emerald-500 animate-pulse" />
                              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Welcome to @{activeChannel.customLink}!</p>
                              <p className="text-xs mt-1 text-zinc-500 max-w-xs leading-relaxed">This is the beginning of the community channel. Only verified sellers can post updates here.</p>
                          </div>
                      ) : (
                          channelMessages.map((msg, idx) => {
                              const isMe = msg.senderId === user.uid;
                              const reactionEntries = Object.entries(msg.reactions || {});
                              const isMenuOpen = activeMessageMenuId === msg.id;

                              return (
                                  <div 
                                    key={msg.id} 
                                    id={`msg-${msg.id}`}
                                    className="flex gap-2 justify-start relative pb-3"
                                    onClick={() => setActiveMessageMenuId(null)}
                                  >
                                      {/* Seller Avatar */}
                                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 self-start overflow-hidden border border-emerald-500/30">
                                          {msg.senderPhoto ? (
                                              <img src={msg.senderPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-xs">
                                                  {(msg.senderName || 'S')[0].toUpperCase()}
                                              </div>
                                          )}
                                      </div>
                                                                   
                                      <div className="max-w-[75%] items-start flex flex-col relative">
                                          {/* Sender Label and Badge */}
                                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                                              <span className="font-extrabold text-[11px] text-[#EF8020]">
                                                  {msg.senderName || 'Verified Seller'}
                                              </span>
                                              <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none scale-90">
                                                  OWNER
                                              </span>
                                          </div>

                                          {/* Quoted Reply Header (if any) */}
                                          {msg.replyTo && (
                                              <div className="mb-1.5 p-2 rounded-xl text-xs border-l-[3px] text-left max-w-full bg-zinc-100 dark:bg-zinc-800 border-emerald-500 text-zinc-600 dark:text-zinc-400">
                                                  <p className="font-bold text-[9px] text-[#EF8020]">
                                                      {msg.replyTo.senderId === user.uid ? "You" : (activeChannel.creatorName || "Owner")}
                                                  </p>
                                                  <p className="truncate text-[10.5px] mt-0.5">{msg.replyTo.text}</p>
                                              </div>
                                          )}

                                          {/* Forwarded Header (if any) */}
                                          {msg.forwardedFrom && (
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mb-1 italic">
                                              <Forward className="w-3 h-3 text-zinc-400" />
                                              <span>Forwarded from {msg.forwardedFrom}</span>
                                            </div>
                                          )}

                                          {/* Post Image */}
                                          {msg.imageUrl && (
                                              <div 
                                                  onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                                  className="mb-1 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm max-w-[280px] cursor-pointer"
                                              >
                                                  <img src={msg.imageUrl} alt="Post Attachment" className="w-full object-cover" />
                                              </div>
                                          )}
                                                                                                      {/* Post text */}
                                          {msg.text && (
                                              <div 
                                                  onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                                  className="px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer select-none relative bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-800"
                                              >
                                                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                                      {renderTextWithLinks(msg.text, false)}
                                                  </p>
                                                  
                                                  {/* URL Preview support */}
                                                  <LinkPreviewCard text={msg.text} />
                                              </div>
                                          )}

                                          {/* Floating Interaction/Reaction Menu */}
                                          {isMenuOpen && (
                                               <motion.div 
                                                   initial={{ opacity: 0, scale: 0.95, y: 5 }} 
                                                   animate={{ opacity: 1, scale: 1, y: 0 }} 
                                                   className="absolute z-50 left-0 -top-12 flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-full px-3 py-1.5"
                                                   onClick={(e) => e.stopPropagation()}
                                               >
                                                   {['👍', '❤️', '😂', '😢', '😡', '🥰'].map(emoji => (
                                                       <button 
                                                           key={emoji} 
                                                           onClick={(e) => { e.stopPropagation(); handleReactToChannelMessage(msg.id, emoji); }} 
                                                           className="hover:scale-125 transition-transform text-base duration-150"
                                                       >
                                                           {emoji}
                                                       </button>
                                                   ))}
                                                   <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                                                   <button 
                                                       onClick={(e) => {
                                                           e.stopPropagation();
                                                           setReplyingTo({ id: msg.id, text: msg.text || "Image attachment", senderId: msg.senderId });
                                                           setActiveMessageMenuId(null);
                                                       }}
                                                       className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
                                                   >
                                                       Reply
                                                   </button>
                                                   <button 
                                                       onClick={(e) => {
                                                           e.stopPropagation();
                                                           setForwardingMessage({
                                                              text: msg.text || "",
                                                              imageUrl: msg.imageUrl || "",
                                                              originalSenderName: msg.senderId === user.uid ? "You" : (msg.senderName || activeChannel.name)
                                                           });
                                                           setShowForwardModal(true);
                                                           setActiveMessageMenuId(null);
                                                       }}
                                                       className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
                                                   >
                                                       Forward
                                                   </button>
                                                   {activeChannel.creatorId === user.uid && (
                                                     <button 
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             handlePinMessage(msg);
                                                             setActiveMessageMenuId(null);
                                                         }}
                                                         className="text-[10px] font-bold text-[#EF8020] uppercase tracking-wider px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
                                                     >
                                                         Pin
                                                     </button>
                                                   )}
                                               </motion.div>
                                          )}

                                          {/* Reactions Badge - ALWAYS positioned on bottom right */}
                                          {reactionEntries.length > 0 && (
                                              <div className="absolute -bottom-2 right-2 flex gap-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-md rounded-full px-1.5 py-0.5 text-[11px] select-none z-10">
                                                  {Array.from(new Set(reactionEntries.map(([uid, emoji]) => emoji))).map((emoji: any) => (
                                                      <span key={emoji}>{emoji}</span>
                                                  ))}
                                                  {reactionEntries.length > 1 && (
                                                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 self-center ml-0.5">{reactionEntries.length}</span>
                                                  )}
                                              </div>
                                          )}

                                          <span className="text-[9px] font-semibold text-zinc-400 mt-1 mx-1">
                                              {formatTime12h(msg.timestamp)}
                                          </span>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Channel Input Area */}
                  <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shrink-0 z-10">
                      <AnimatePresence>
                          {replyingTo && (
                               <motion.div 
                                   initial={{ opacity: 0, y: 10 }} 
                                   animate={{ opacity: 1, y: 0 }} 
                                   exit={{ opacity: 0, y: 10 }} 
                                   className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/80 border-l-[4px] border-emerald-500 rounded-r-xl flex items-center justify-between text-left"
                               >
                                   <div>
                                       <p className="text-[10px] font-bold text-[#EF8020]">Replying to</p>
                                       <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-xs sm:max-w-md mt-0.5">{replyingTo.text}</p>
                                   </div>
                                   <button onClick={() => setReplyingTo(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
                                       <X className="w-4 h-4" />
                                   </button>
                               </motion.div>
                          )}
                          {previewUrl && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-3 relative inline-block">
                                  <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                  <button onClick={() => { setAttachment(null); setPreviewUrl(''); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                      <X className="w-3.5 h-3.5" />
                                  </button>
                              </motion.div>
                          )}
                      </AnimatePresence>

                      {activeChannel.creatorId === user.uid ? (
                          <div className="flex items-center gap-2">
                              <button 
                                  type="button" 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="p-3 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-800 rounded-xl transition"
                                  title="Add Image"
                              >
                                  <ImageIcon className="w-5 h-5" />
                              </button>
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={handleAttachmentChange} 
                              />
                              
                              <div className="flex-1 relative">
                                  <textarea 
                                      value={newMessage}
                                      onChange={(e) => setNewMessage(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSendMessage();
                                        }
                                      }}
                                      placeholder="Broadcast an update with links, text, or images..."
                                      className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 ring-emerald-500/50 resize-none max-h-24 min-h-[44px]"
                                  />
                              </div>

                              <button 
                                  type="button"
                                  onClick={handleSendMessage}
                                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md"
                                  title="Publish Post"
                              >
                                  <Send className="w-5 h-5" />
                              </button>
                          </div>
                      ) : (
                          <div className="text-center py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-500 dark:text-zinc-400 rounded-xl">
                               📢 Only verified sellers can post updates in this community.
                          </div>
                      )}
                  </div>
             </>
         ) : !activeChat ? (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                 <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                     </svg>
                 </div>
                 <p className="font-bold text-lg text-zinc-600 dark:text-zinc-300">Your Messages</p>
                 <p className="text-sm mt-1">Select a chat or community channel to start messaging</p>
             </div>
         ) : (
             <>
                 {/* Active Chat Header */}
                 <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-10 shadow-sm">
                     <div className="flex items-center gap-3 min-w-0">
                         <button 
                           type="button"
                           onClick={() => setSearchParams({})} 
                           className="md:hidden p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shrink-0"
                           title="Back to Chats"
                         >
                             <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                         </button>
                         
                         <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                             {activeChat.otherUser?.photoURL ? (
                                 <img src={activeChat.otherUser.photoURL} alt={activeChat.otherUser.displayName} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                     {(activeChat.otherUser?.displayName || activeChat.otherUser?.shopName || 'U')[0].toUpperCase()}
                                 </div>
                             )}
                         </div>
                         
                         <div className="min-w-0">
                             <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate">
                                 {activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || 'Unknown User'}
                             </h3>
                             <p className={cn("text-[10px] font-bold flex items-center gap-1", otherUserPresence?.isOnline ? "text-emerald-500" : "text-zinc-500")}>
                                 <span className={cn("w-1.5 h-1.5 rounded-full", otherUserPresence?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400/80")}></span>
                                 {getLastActiveText(otherUserPresence)}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-center gap-1.5 shrink-0">
                         <button 
                           type="button"
                           onClick={() => startCall('audio')} 
                           className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition" 
                           title="Voice Call"
                         >
                             <Phone className="w-4.5 h-4.5" />
                         </button>
                     </div>
                 </div>

                 {/* Messages Area */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                     <div className="flex justify-center my-6">
                         <span className="text-[10px] font-bold text-zinc-400 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                             End-to-End Encrypted
                         </span>
                     </div>
                     
                     {messages.map((msg, idx) => {
                         const isMe = msg.senderId === user.uid;
                         const showAvatar = !isMe && (idx === 0 || messages[idx-1]?.senderId !== msg.senderId);
                         const isSystem = !!msg.systemType;
                         const isMenuOpen = activeMessageMenuId === msg.id;
                         const reactionEntries = Object.entries(msg.reactions || {});

                         if (isSystem) {
                             return (
                                 <div key={msg.id} className="flex justify-center my-4">
                                     <CallBubble msg={msg} />
                                 </div>
                             );
                         }

                         return (
                             <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} relative pb-3`} onClick={() => setActiveMessageMenuId(null)}>
                                 {!isMe && (
                                     <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 self-end overflow-hidden mb-1">
                                         {showAvatar && (
                                             activeChat.otherUser?.photoURL ? 
                                                 <img src={activeChat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> :
                                                 <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-xs">
                                                     {(activeChat.otherUser?.displayName || 'U')[0].toUpperCase()}
                                                 </div>
                                         )}
                                     </div>
                                 )}
                                 
                                 <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative`}>
                                     {/* Reaction / Reply floating menu */}
                                     {isMenuOpen && (
                                         <motion.div 
                                             initial={{ opacity: 0, scale: 0.95, y: 5 }} 
                                             animate={{ opacity: 1, scale: 1, y: 0 }} 
                                             className={`absolute z-50 ${isMe ? 'right-0' : 'left-0'} -top-12 flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-full px-3 py-1.5`}
                                             onClick={(e) => e.stopPropagation()}
                                         >
                                             {['👍', '❤️', '😂', '😢', '😡', '🥰'].map(emoji => (
                                                 <button 
                                                     key={emoji} 
                                                     onClick={(e) => { e.stopPropagation(); handleReactToMessage(msg.id, emoji); }} 
                                                     className="hover:scale-125 transition-transform text-base duration-150"
                                                 >
                                                     {emoji}
                                                 </button>
                                             ))}
                                             <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                                             <button 
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     setReplyingTo({ id: msg.id, text: msg.text || "Image attachment", senderId: msg.senderId });
                                                     setActiveMessageMenuId(null);
                                                 }}
                                                 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
                                             >
                                                 Reply
                                             </button>
                                             <button 
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     setForwardingMessage({
                                                        text: msg.text || "",
                                                        imageUrl: msg.imageUrl || "",
                                                        originalSenderName: msg.senderId === user.uid ? "You" : (activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || "User")
                                                     });
                                                     setShowForwardModal(true);
                                                     setActiveMessageMenuId(null);
                                                 }}
                                                 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
                                             >
                                                 Forward
                                             </button>
                                         </motion.div>
                                     )}

                                     {/* Forwarded Header (if any) */}
                                     {msg.forwardedFrom && (
                                       <div className={`flex items-center gap-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-zinc-400 dark:text-zinc-500'} font-bold mb-1 italic`}>
                                         <Forward className="w-3 h-3" />
                                         <span>Forwarded from {msg.forwardedFrom}</span>
                                       </div>
                                     )}

                                     {/* Replying to quoted message preview inside bubble */}
                                     {msg.replyTo && (
                                         <div className={`mb-1.5 p-2 rounded-xl text-xs border-l-[3px] text-left max-w-full ${isMe ? 'bg-black/10 border-emerald-300 text-emerald-100' : 'bg-zinc-100 dark:bg-zinc-800 border-emerald-500 text-zinc-600 dark:text-zinc-400'}`}>
                                             <p className="font-bold text-[9px] text-[#EF8020]">
                                                 {msg.replyTo.senderId === user.uid ? "You" : (activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || "User")}
                                             </p>
                                             <p className="truncate text-[10.5px] mt-0.5">{msg.replyTo.text}</p>
                                         </div>
                                     )}

                                     {msg.imageUrl && (
                                         <div 
                                             onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                             className="mb-1 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm max-w-[240px] cursor-pointer"
                                         >
                                             <img src={msg.imageUrl} alt="Attachment" className="w-full object-cover" />
                                         </div>
                                     )}
                                     
                                     {msg.text && (
                                         <div 
                                             onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                             className={`px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer select-none relative ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-800'}`}
                                         >
                                             <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                                 {renderTextWithLinks(msg.text, isMe)}
                                             </p>
                                             <LinkPreviewCard text={msg.text} isMe={isMe} />
                                         </div>
                                     )}

                                     {/* Reactions Badge */}
                                     {reactionEntries.length > 0 && (
                                         <div className={`absolute -bottom-2 ${isMe ? 'right-2' : 'left-2'} flex gap-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-md rounded-full px-1.5 py-0.5 text-[11px] select-none z-10`}>
                                             {Array.from(new Set(reactionEntries.map(([uid, emoji]) => emoji))).map((emoji: any) => (
                                                 <span key={emoji}>{emoji}</span>
                                             ))}
                                             {reactionEntries.length > 1 && (
                                                 <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 self-center ml-0.5">{reactionEntries.length}</span>
                                             )}
                                         </div>
                                     )}

                                     <span className="text-[9px] font-semibold text-zinc-400 mt-1 mx-1">
                                         {formatTime12h(msg.timestamp)}</span>{isMe && idx === messages.length - 1 && <div className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-wide select-none">{activeChat.seenBy && activeChat.seenBy.includes(activeChat.otherUser.id) ? "Seen" : (otherUserPresence?.isOnline ? "Delivered" : "Sent")}</div>}<span className="hidden">
                                     </span>
                                 </div>
                             </div>
                         );
                     })}
                     {!hasReviewed && activeChat.otherUser?.id !== "system" && (!reviewDismissedAt || (Date.now() - reviewDismissedAt >= 24 * 60 * 60 * 1000)) && (messages.length >= 4 || (messages.length > 0 && (Date.now() - messages[messages.length - 1].timestamp) > 3600000)) && (
                       <div className="flex justify-center my-6">
                         <div 
                           className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900/90 dark:to-zinc-950/90 border border-amber-200 dark:border-zinc-800 rounded-2xl p-4 max-w-sm w-full text-center shadow-md hover:shadow-lg transition cursor-pointer border-dashed relative" 
                           onClick={() => { setShowReviewModal(true); }}
                         >
                           <button 
                             type="button" 
                             onClick={(e) => {
                               e.stopPropagation();
                               const now = Date.now();
                               localStorage.setItem('dismissed_review_' + activeChat.id, now.toString());
                               setReviewDismissedAt(now);
                             }}
                             className="absolute top-2 right-2 p-1 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                             title="Dismiss for 24h"
                           >
                             <X className="w-3.5 h-3.5" />
                           </button>
                           <div className="flex items-center justify-center gap-1.5 mb-2 text-amber-500">
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                           </div>
                           <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                             <Sparkles className="w-4 h-4 text-amber-500" />
                             <span>Give a Review</span>
                           </h4>
                           <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed pr-4">
                             Rate your experience with <strong className="text-[#EF8020]">{activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || "Verified Seller"}</strong>. It will be styled beautifully on their profile page!
                           </p>
                         </div>
                       </div>
                     )}
                     <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area */}
                 <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shrink-0 z-10">
                     <AnimatePresence>
                         {replyingTo && (
                             <motion.div 
                                 initial={{ opacity: 0, y: 10 }} 
                                 animate={{ opacity: 1, y: 0 }} 
                                 exit={{ opacity: 0, y: 10 }} 
                                 className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/80 border-l-[4px] border-emerald-500 rounded-r-xl flex items-center justify-between text-left"
                             >
                                 <div>
                                     <p className="text-[10px] font-bold text-[#EF8020]">Replying to</p>
                                     <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-xs sm:max-w-md mt-0.5">{replyingTo.text}</p>
                                 </div>
                                 <button onClick={() => setReplyingTo(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
                                     <X className="w-4 h-4" />
                                 </button>
                             </motion.div>
                         )}
                         {previewUrl && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-3 relative inline-block">
                                 <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                                     <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                 </div>
                                 <button onClick={() => { setAttachment(null); setPreviewUrl(''); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                     <X className="w-3.5 h-3.5" />
                                 </button>
                             </motion.div>
                         )}
                     </AnimatePresence>
                     
                     <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 sm:p-2 rounded-[24px] border border-zinc-200 dark:border-zinc-700 focus-within:border-emerald-500/50 focus-within:ring-2 ring-emerald-500/20 transition-all">
                         <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                         
                         <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0" title="Attach Image">
                             <Paperclip className="w-5 h-5" />
                         </button>
                         
                         
                         
                         <textarea
                             value={newMessage}
                             onChange={(e) => setNewMessage(e.target.value)}
                             onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     handleSendMessage();
                                 }
                             }}
                             placeholder={`Message ${activeChat?.otherUser?.shopName || activeChat?.otherUser?.displayName || 'Seller'}...`}
                             className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-medium leading-tight"
                             rows={1}
                         />
                         
                         <button 
                             onClick={handleSendMessage}
                             disabled={!newMessage.trim() && !attachment}
                             className={`p-3 rounded-full shrink-0 transition-all ${(newMessage.trim() || attachment) ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-500 active:scale-95' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}
                         >
                             <Send className="w-5 h-5 ml-0.5" />
                         </button>
                     </div>
                 </div>
             </>
         )}
      </div>

      {/* Full Screen Call UI Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] bg-zinc-900 flex flex-col font-inter"
          >
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-emerald-500/10 rounded-full blur-3xl" />
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full pt-16 pb-12 px-6">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={endCall} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md">
                        End-to-End Encrypted
                    </span>
                    <div className="w-10 h-10"></div>
                </div>

                <div className="flex flex-col items-center flex-1 justify-center -mt-16">
                    <div className="relative mb-8">
                        {callStatus === 'ringing' && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" style={{ animationDuration: '2s' }} />
                                <div className="absolute inset-[-20px] rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }} />
                            </>
                        )}
                        <div className="w-32 h-32 rounded-full overflow-hidden border-[4px] border-emerald-500 shadow-2xl relative z-10 bg-zinc-800">
                             {activeChat?.otherUser?.photoURL ? (
                                 <img src={activeChat.otherUser.photoURL} alt="User" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold text-4xl">
                                     {(activeChat?.otherUser?.displayName || 'U')[0].toUpperCase()}
                                 </div>
                             )}
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                        {activeChat?.otherUser?.shopName || activeChat?.otherUser?.displayName || 'User'}
                    </h2>
                    
                    <p className="text-emerald-400 font-bold tracking-wide">
                        {callStatus === 'connecting' && "Connecting..."}
                        {callStatus === 'ringing' && "Ringing..."}
                        {callStatus === 'connected' && formatDuration(callDuration)}
                    </p>
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-auto">
                    <button onClick={() => setIsMuted(!isMuted)} className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all backdrop-blur-md ${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                        {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </button>
                    
                    <button onClick={endCall} className="w-[84px] h-[84px] rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95">
                        <PhoneOff className="w-8 h-8" />
                    </button>
                    
                    <button onClick={() => setIsSpeaker(!isSpeaker)} className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all backdrop-blur-md ${isSpeaker ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                        <Volume2 className="w-7 h-7" />
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Dialog Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden font-inter"
            >
              <button 
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-3 animate-pulse">
                  <Star className="w-8 h-8 fill-amber-500" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                  Leave a Review
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  How was your experience trading or chatting with {activeChat?.otherUser?.shopName || activeChat?.otherUser?.displayName || "Verified Seller"}?
                </p>
              </div>

              {/* Star Selection */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 active:scale-95 transition"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        star <= reviewRating ? "text-amber-500 fill-amber-500" : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment Text */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Review Text (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us more about the trade, behavior, response time..."
                  rows={4}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={handleSubmitReview}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-55"
                >
                  {isSubmittingReview ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Create Community Channel Modal --- */}
      <AnimatePresence>
        {showCreateChannelModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden font-inter"
            >
              <button 
                type="button"
                onClick={() => setShowCreateChannelModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                  <span>Create Community Channel</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Launch a dedicated channel to broadcast updates, product arrivals, discounts, and visual media to your unmuted subscribers.
                </p>
              </div>

              <div className="space-y-4">
                {/* Channel Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={chanName}
                    onChange={(e) => setChanName(e.target.value)}
                    placeholder="e.g. Vintage Gadgets Elite"
                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Unique Username/Link */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Custom Link / Handle (Unique)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-zinc-400 text-sm font-bold">@</span>
                    <input
                      type="text"
                      value={chanLink}
                      onChange={(e) => setChanLink(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="vintage_elite"
                      className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                    Only letters, numbers, and underscores are allowed. This works as your channel's reservation link.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Channel Description
                  </label>
                  <textarea
                    value={chanDesc}
                    onChange={(e) => setChanDesc(e.target.value)}
                    placeholder="Describe your community updates..."
                    rows={3}
                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none focus:ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
                  />
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Channel Image Cover URL
                  </label>
                  <input
                    type="url"
                    value={chanImage}
                    onChange={(e) => setChanImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10.5px] font-bold text-zinc-400">Quick Gradients:</span>
                    {[
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
                      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80',
                      'https://images.unsplash.com/photo-1618005198143-e528346d9a77?auto=format&fit=crop&w=150&q=80'
                    ].map((url, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setChanImage(url)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      >
                        Preset {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateChannel}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  Create Channel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Forward Message Modal --- */}
      <AnimatePresence>
        {showForwardModal && forwardingMessage && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden font-inter"
            >
              <button 
                type="button"
                onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Forward className="w-5 h-5 text-[#EF8020]" />
                  <span>Forward Message</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Select a private chat or subscribed community channel to share this content.
                </p>
              </div>

              {/* Preview forwarding content */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-4 border border-zinc-100 dark:border-zinc-800/80 text-xs">
                <p className="font-extrabold text-[#EF8020] mb-1">Previewing Content:</p>
                {forwardingMessage.imageUrl && (
                  <img src={forwardingMessage.imageUrl} alt="Forward attachment" className="w-16 h-16 object-cover rounded-lg mb-1" />
                )}
                <p className="text-zinc-600 dark:text-zinc-300 italic truncate">"{forwardingMessage.text || 'Image Attachment'}"</p>
              </div>

              {/* Destination list */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {/* List Community channels */}
                {channels.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Subscribed Communities</h5>
                    <div className="space-y-1">
                      {channels.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => handleSendForward(ch, true)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl bg-zinc-50 hover:bg-emerald-50 dark:bg-zinc-800/30 dark:hover:bg-zinc-800 transition text-left"
                        >
                          <img src={ch.imageUrl} alt="Channel img" className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">{ch.name}</p>
                            <p className="text-[10px] text-zinc-400 truncate">@{ch.customLink}</p>
                          </div>
                          <Forward className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* List direct messages */}
                {chats.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Private Direct Chats</h5>
                    <div className="space-y-1">
                      {chats.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSendForward(c, false)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl bg-zinc-50 hover:bg-emerald-50 dark:bg-zinc-800/30 dark:hover:bg-zinc-800 transition text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-emerald-700">
                            {c.otherUser?.photoURL ? (
                              <img src={c.otherUser.photoURL} alt="User img" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (c.otherUser?.displayName || 'U')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                              {c.otherUser?.shopName || c.otherUser?.displayName || 'Chat'}
                            </p>
                          </div>
                          <Forward className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Community Channel Details Modal --- */}
      <AnimatePresence>
        {showChannelDetailsModal && activeChannel && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden font-inter"
            >
              <button 
                type="button"
                onClick={() => setShowChannelDetailsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition z-10"
              >
                <X className="w-5 h-5 text-white bg-black/30 backdrop-blur-sm p-1 rounded-full" />
              </button>

              {/* Cover Banner Image */}
              <div className="h-44 w-full relative rounded-2xl overflow-hidden mb-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <img src={activeChannel.imageUrl} alt="Channel cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Verified Community</span>
                  <h3 className="text-xl font-black text-white tracking-tight mt-0.5">{activeChannel.name}</h3>
                  <p className="text-xs text-white/80 font-bold">@{activeChannel.customLink}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <h5 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Description</h5>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-850">
                  {activeChannel.description || "Welcome to our exclusive product broadcast channel. Join for periodic updates, visual arrivals, and direct chat links!"}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center border border-zinc-100 dark:border-zinc-850">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Subscribers</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeChannel.subscriberCount || 1}</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center border border-zinc-100 dark:border-zinc-850">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Creator</p>
                  <p className="text-xs font-black text-[#EF8020] truncate mt-1.5">{activeChannel.creatorName || "Verified Seller"}</p>
                </div>
              </div>

              {/* Unsubscribe / Mute / Action Buttons */}
              <div className="space-y-2">
                {userSubscription ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleMuteChannel(activeChannel, userSubscription.muted)}
                      className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
                    >
                      {userSubscription.muted ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
                      <span>{userSubscription.muted ? "Unmute Channel Broadcasts" : "Mute Notifications"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUnsubscribeFromChannel(activeChannel);
                        setShowChannelDetailsModal(false);
                      }}
                      className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Unsubscribe from Community</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleSubscribeToChannel(activeChannel);
                      setShowChannelDetailsModal(false);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Subscribe to Channel</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
