// Mock chat API for testing the chat interface
// This can be removed once the backend endpoints are ready

export const mockChatAPI = {
  // Start a new conversation
  startConversation: async (campaignId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    return {
      conversation_id: `conv-${Date.now()}`,
      initial_message_id: `msg-${Date.now()}`,
      message: "Hi! I'm here to help you create an amazing podcast guest profile. Let's start with something simple - what's your name?",
      quick_replies: ["Skip intro", "Tell me more about this process"],
      phase: "warm-up",
      progress: 5
    };
  },

  // Send a message and get response
  sendMessage: async (conversationId: string, text: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate thinking
    
    // Mock response based on conversation progress
    const responses = [
      {
        message_id: `msg-${Date.now()}`,
        response: "Great to meet you! Now, could you tell me a bit about what you do professionally? Just share in your own words - I'll help polish it later.",
        quick_replies: ["I'm a founder", "I work in tech", "I'm a consultant"],
        extracted_data: { fullName: text },
        progress: 10,
        phase: "warm-up"
      },
      {
        message_id: `msg-${Date.now()}`,
        response: "That's fascinating! What would you say are your main areas of expertise? What topics do you love talking about?",
        quick_replies: ["Marketing & Growth", "Leadership", "Technology", "Innovation"],
        extracted_data: { professionalRole: text },
        progress: 20,
        phase: "discovery"
      },
      {
        message_id: `msg-${Date.now()}`,
        response: "Excellent! Can you share a specific achievement or project you're particularly proud of? This helps podcasters understand your experience.",
        quick_replies: [],
        extracted_data: { expertiseAreas: text },
        progress: 35,
        phase: "discovery"
      }
    ];
    
    // Return a random response for demo purposes
    const responseIndex = Math.floor(Math.random() * responses.length);
    return responses[responseIndex];
  },

  // Resume an existing conversation
  resumeConversation: async (conversationId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      conversation_id: conversationId,
      messages: [
        {
          id: "msg-1",
          text: "Hi! I'm here to help you create an amazing podcast guest profile. Let's start with something simple - what's your name?",
          sender: "bot",
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          id: "msg-2",
          text: "John Smith",
          sender: "user",
          timestamp: new Date(Date.now() - 3500000)
        },
        {
          id: "msg-3",
          text: "Great to meet you, John! Now, could you tell me a bit about what you do professionally?",
          sender: "bot",
          timestamp: new Date(Date.now() - 3400000)
        }
      ],
      progress: 15,
      phase: "warm-up"
    };
  }
};

// Helper to determine if we should use mock API
export const shouldUseMockAPI = () => {
  // Only use mock API if explicitly enabled
  const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';
  
  return useMock;
};