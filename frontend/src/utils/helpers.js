import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// Get chat name for display
export const getChatName = (chat, currentUser) => {
  if (chat.isGroupChat) {
    return chat.chatName;
  }
  
  const otherUser = chat.users.find((user) => user._id !== currentUser._id);
  return otherUser?.name || 'Unknown User';
};

// Get chat avatar
export const getChatAvatar = (chat, currentUser) => {
  if (chat.isGroupChat) {
    return chat.groupAvatar?.url || 'https://icon-library.com/images/group-icon/group-icon-14.jpg';
  }
  
  const otherUser = chat.users.find((user) => user._id !== currentUser._id);
  return otherUser?.avatar?.url || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
};

// Get other user in one-to-one chat
export const getOtherUser = (chat, currentUserId) => {
  if (chat.isGroupChat) return null;
  return chat.users.find((user) => user._id !== currentUserId);
};

// Format message time
export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }
  
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  
  return format(messageDate, 'dd/MM/yyyy');
};

// Format last seen
export const formatLastSeen = (date) => {
  if (!date) return 'Never';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Truncate text
export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Check if user is online
export const isUserOnline = (userId, onlineUsers) => {
  return onlineUsers.includes(userId);
};

// Get sender name
export const getSenderName = (message, currentUserId) => {
  if (message.sender._id === currentUserId) {
    return 'You';
  }
  return message.sender.name;
};

// Group messages by date
export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    let key;
    
    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else {
      key = format(date, 'dd MMMM yyyy');
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
  });
  
  return groups;
};

// Check if message is read
export const isMessageRead = (message, userId) => {
  return message.readBy?.includes(userId);
};
