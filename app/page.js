'use client'

import { Box, Stack, TextField, IconButton } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic'; // Import the Mic icon
import { keyframes } from '@mui/system';


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm 💪FitB, your personal AI coach. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const pulse = keyframes`
  0% {
    box-shadow: 0 0 20px 10px rgba(66, 165, 245, 0.6);
  }
  50% {
    box-shadow: 0 0 30px 20px rgba(66, 165, 245, 0.8);
  }
  100% {
    box-shadow: 0 0 20px 10px rgba(66, 165, 245, 0.6);
  }
`;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize SpeechRecognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };
    }
  }, []);

  const startRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;  // Don't send empty messages
    setIsLoading(true);

    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }])
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundImage: 'url(./image.jpg)', // Replace with your image path
        backgroundSize: 'cover', // Adjusts the image to cover the whole area
        backgroundPosition: 'center', // Centers the image
        backgroundRepeat: 'no-repeat', // Ensures the image doesn't repeat
      }}
    >
      <Stack
        direction={'column'}
        width="100%"
        maxWidth="500px"
        height="100%"
        maxHeight="700px"
        border="1px solid black"
        borderRadius={16}
        p={2}
        spacing={3}
        sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          animation: `${pulse} 2s infinite`,        }}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          maxHeight="100%"
          sx={{
            overflowY: 'auto', // Allow vertical scrolling
            scrollbarWidth: 'none', // For Firefox
            '&::-webkit-scrollbar': {
              display: 'none', // For Chrome, Safari, and Edge
            },
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              {message.role === 'assistant' && (
                <>
                  <img 
                    src="/ima.ico" 
                    alt="AI Assistant Icon" 
                    style={{ width: '24px', height: '24px', marginRight: '8px' }} 
                  />
                  <br/>
                </>
              )}
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'black'
                    : 'white'
                }
                color={
                  message.role === 'assistant'
                    ? 'white'
                    : 'black'
                }
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} /> 
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <IconButton onClick={startRecognition} color="primary">
            <MicIcon sx={{ color: 'white' }} /> {/* Microphone button */}
          </IconButton>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px', // Change the border radius here
                backgroundColor: 'rgba(255, 255, 255, 0.5)', // White background with 0.5 opacity
              },
            }}
          />
          <IconButton onClick={sendMessage} disabled={isLoading} sx={{ color: 'white' }}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
