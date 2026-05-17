import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';
import API_URL from '../config';

const ENDPOINT = API_URL;
let socket;

const Chat = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [generatingIcebreaker, setGeneratingIcebreaker] = useState(false);
  
  // WebRTC Voice Calling States
  const [callState, setCallState] = useState('idle'); // idle, calling, incoming, connected
  const [incomingCallOffer, setIncomingCallOffer] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const messagesEndRef = useRef(null);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const userInfoObj = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfoObj) {
      navigate('/login');
      return;
    }

    socket = io(ENDPOINT);
    socket.emit('setup', userInfoObj);

    socket.on('message received', (newMessageReceived) => {
      if (newMessageReceived.sender === targetUserId) {
        setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
      }
    });

    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    // WebRTC Voice Calling Relays
    socket.on('incoming-call', (data) => {
      setIncomingCallOffer(data);
      setCallState('incoming');
    });

    socket.on('call-accepted', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState('connected');
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    socket.on('call-rejected', () => {
      alert("Call declined/missed");
      cleanupCall();
    });

    socket.on('call-ended', () => {
      cleanupCall();
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate, targetUserId]);

  useEffect(() => {
    const userInfoObj = JSON.parse(localStorage.getItem('userInfo'));
    const fetchMessagesAndUser = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfoObj.token}` } };
        
        const { data: msgs } = await axios.get(`${API_URL}/api/messages/${targetUserId}`, config);
        setMessages(msgs);

        // Fetch matched user details from matches overview
        const { data: matches } = await axios.get(`${API_URL}/api/matches`, config);
        const matchedUser = matches.find(m => m._id === targetUserId);
        if (matchedUser) {
          setTargetUser(matchedUser);
        }
        
        socket.emit('join chat', targetUserId);
      } catch (error) {
        console.error(error);
      }
    };
    
    if (userInfoObj) fetchMessagesAndUser();
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', targetUserId);
    }

    let lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit('stop typing', targetUserId);
        setTyping(false);
      }
    }, timerLength);
  };

  const generateIcebreaker = async () => {
    try {
      setGeneratingIcebreaker(true);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`${API_URL}/api/ai/icebreaker`, {
        targetUserId
      }, config);
      setNewMessage(data.icebreaker);
      setGeneratingIcebreaker(false);
    } catch (error) {
      console.error(error);
      setGeneratingIcebreaker(false);
    }
  };

  // WebRTC Voice Calling Actions
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: targetUserId,
            candidate: event.candidate
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        userToCall: targetUserId,
        offer,
        from: userInfo._id
      });

      setCallState('calling');
    } catch (err) {
      console.error("Error starting call", err);
      alert("Could not start call. Please check microphone permissions.");
    }
  };

  const acceptCall = async () => {
    try {
      if (!incomingCallOffer) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: incomingCallOffer.from,
            candidate: event.candidate
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallOffer.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', {
        to: incomingCallOffer.from,
        answer
      });

      setCallState('connected');
    } catch (err) {
      console.error("Error accepting call", err);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (incomingCallOffer) {
      socket.emit('reject-call', { to: incomingCallOffer.from });
    }
    cleanupCall();
  };

  const endCall = () => {
    socket.emit('end-call', { to: targetUserId });
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallState('idle');
    setIncomingCallOffer(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (socket) socket.emit('stop typing', targetUserId);
      setTyping(false);
      
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      setNewMessage('');
      
      const { data } = await axios.post(`${API_URL}/api/messages/${targetUserId}`, {
        text: newMessage
      }, config);
      
      socket.emit('new message', data);
      setMessages([...messages, data]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sticky top-0 z-10 transition">
        <button onClick={() => navigate('/matches')} className="p-2 text-primary">
          <ArrowLeft size={24} />
        </button>
        <div className="ml-4 flex items-center">
          <div className="w-10 h-10 bg-gradient-primary rounded-full overflow-hidden flex items-center justify-center text-white font-bold shadow-sm">
            {targetUser?.photos?.[0] ? (
              <img src={targetUser.photos[0]} alt={targetUser.name} className="w-full h-full object-cover" />
            ) : (
              targetUser?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="ml-3">
            <h1 className="text-sm font-bold text-gray-800 dark:text-gray-250 leading-tight">
              {targetUser?.name || 'Chat'}
            </h1>
            {targetUser?.department && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold tracking-wide mt-0.5">
                {targetUser.department} {targetUser.batch ? `• ${targetUser.batch}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="ml-auto pr-2">
          <button 
            onClick={startCall}
            className="p-2.5 text-primary hover:scale-105 transition"
            title="Start voice call"
          >
            📞
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4 bg-gray-50 dark:bg-gray-950 transition">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === userInfo._id;
          return (
            <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-gradient-primary text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start items-center space-x-2 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs px-4 py-2 rounded-2xl rounded-bl-sm w-max animate-pulse">
            <span>💬 {targetUser?.name || 'Someone'} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden audio tag for WebRTC voice calling */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Interactive Calling Overlay Panel */}
      {callState !== 'idle' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white select-none animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-4xl font-extrabold mx-auto shadow-2xl border-4 border-white/20 animate-pulse overflow-hidden">
              {targetUser?.photos?.[0] ? (
                <img src={targetUser.photos[0]} alt={targetUser.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                targetUser?.name?.charAt(0) || 'U'
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{targetUser?.name || 'Someone'}</h2>
            
            <p className="text-gray-400 text-sm animate-pulse mt-1">
              {callState === 'calling' && 'Ringing... 📞'}
              {callState === 'incoming' && 'Incoming Voice Call... 🔔'}
              {callState === 'connected' && 'Connected 🎙️'}
            </p>
          </div>

          <div className="mt-12 flex space-x-6">
            {callState === 'incoming' ? (
              <>
                <button 
                  onClick={rejectCall}
                  className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition text-xl"
                  title="Decline Call"
                >
                  ❌
                </button>
                <button 
                  onClick={acceptCall}
                  className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition text-xl animate-bounce"
                  title="Accept Call"
                >
                  📞
                </button>
              </>
            ) : (
              <button 
                onClick={endCall}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition text-xl animate-pulse"
                title="Hang Up"
              >
                ❌
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="h-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center px-4 sticky bottom-0 transition">
        <button
          type="button"
          onClick={generateIcebreaker}
          disabled={generatingIcebreaker}
          className="mr-3 w-12 h-12 bg-red-50 dark:bg-gray-800 text-primary dark:text-red-400 border border-red-100 dark:border-gray-700 hover:bg-red-100 dark:hover:bg-gray-700 hover:scale-105 rounded-full flex items-center justify-center font-bold shadow-sm transition disabled:opacity-50"
          title="Generate campus icebreaker using AI!"
        >
          {generatingIcebreaker ? '⏳' : '✨'}
        </button>
        <input 
          type="text" 
          value={newMessage}
          onChange={typingHandler}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm transition"
        />
        <button type="submit" className="ml-3 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition">
          <Send size={20} className="ml-1" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
