import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../config/constants';

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const selectedChat = useChatStore((state) => state.selectedChat);
  const addMessage = useChatStore((state) => state.addMessage);
  const addOnlineUser = useChatStore((state) => state.addOnlineUser);
  const removeOnlineUser = useChatStore((state) => state.removeOnlineUser);
  const addNotification = useChatStore((state) => state.addNotification);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize socket connection and set up only after low-level connect
    const socket = getSocket();

    if (socket.disconnected) {
      socket.connect();
    }

    const onConnect = () => {
      // After underlying transport is open, announce user
      socket.emit(SOCKET_EVENTS.SETUP, user);
    };
    socket.on('connect', onConnect);

    const onConnected = () => {
      console.log('Socket connected');
    };
    socket.on(SOCKET_EVENTS.CONNECTED, onConnected);

    // Listen for user online/offline
    socket.on(SOCKET_EVENTS.USER_ONLINE, (userId) => {
      addOnlineUser(userId);
    });

    socket.on(SOCKET_EVENTS.USER_OFFLINE, (userId) => {
      removeOnlineUser(userId);
    });

    // Listen for new messages
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, (newMessage) => {
      if (selectedChat && selectedChat._id === newMessage.chat._id) {
        // If the open chat matches, append the message locally
        addMessage(newMessage);
      }
      // Otherwise, Sidebar will handle unread badges via its own socket listener.
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off(SOCKET_EVENTS.CONNECTED, onConnected);
      socket.off(SOCKET_EVENTS.USER_ONLINE);
      socket.off(SOCKET_EVENTS.USER_OFFLINE);
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED);
    };
  }, [user, selectedChat?._id]);

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Sidebar - Show on mobile only when no chat selected */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar />
      </div>
      
      {/* Chat Window - Show on mobile only when chat selected */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 w-full`}>
        <ChatWindow />
      </div>
    </div>
  );
};

export default Home;
