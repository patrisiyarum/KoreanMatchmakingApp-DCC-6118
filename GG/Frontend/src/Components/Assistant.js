import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import "./Assistant.css";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Button from "react-bootstrap/Button";
import {
  handleChatWithAssistant,
  handleSaveConversation,
  handleLoadConversationFromDB,
  handleClearConversation,
  handleGetConversation,
  handleGetAllAIChats
} from "../Services/aiAssistantService";
import { handleUserDashBoardApi } from "../Services/dashboardService";
import { handleGetUserPreferencesApi } from "../Services/findFriendsService";

export default function Assistant() {
  const [search] = useSearchParams();
  const idFromUrl = search.get("id");
  const chatIdFromUrl = search.get("chatId");
  const navigate = useNavigate();
  const location = useLocation();
  const [processedAlerts] = useState(new Set());

  const [userId, setUserId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your Language Exchange Learning Assistant. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // --- Voice Input States & Refs (MediaRecorder) ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // --------------------------------------------------
  const highlightGoals = (text) => {
    return text.replace(
      /Goals for Improvement:/gi,
      `<span class="highlight-goals">Goals for Improvement:</span>`
    );
  };

  useEffect(() => {
    // Set chatId from URL parameter and autofill summary request
    if (chatIdFromUrl) {
        setChatId(chatIdFromUrl);
        setInput(`Please summarize my practice session.`);
      }
  }, [chatIdFromUrl]);

  useEffect(() => {
    // ... (Existing useEffect for fetchUserId remains the same)
    const fetchUserId = async () => {
      try {
        if (idFromUrl) {
          const numericId = parseInt(idFromUrl);
          if (!isNaN(numericId)) {
            try {
              const userData = await handleUserDashBoardApi(numericId);
              if (userData && userData.user) {
                setUserId(numericId);
                return;
              }
            } catch {
              setError("User not found.");
              return;
            }
          }
        }

        const prefs = await handleGetUserPreferencesApi();
        if (!prefs?.data?.length) {
          setError("User ID is required in the URL.");
        }
      } catch {
        setError("Failed to fetch user information.");
      }
    };

    fetchUserId();
  }, [idFromUrl]);

  useEffect(() => {
    // ... (Existing useEffect for fetchHistory remains the same)
    if (!userId) return;

    const fetchHistory = async () => {
      try {
        const result = await handleGetAllAIChats(userId);
        const chats = result.chats || [];

        const formatted = chats.map(chat => {
          let conversationArray = chat.conversation;

          // Parse if string (fallback)
          if (typeof conversationArray === "string") {
            try { conversationArray = JSON.parse(conversationArray); }
            catch { conversationArray = []; }
          }

          // If already an array (old format), use it directly
          if (Array.isArray(conversationArray)) {
            // Already in correct format, continue
          }
          // Handle object formats
          else if (conversationArray && typeof conversationArray === "object") {
            // Format: { conversation: { messages: [...], state: null, pendingData: {} } }
            if (conversationArray.conversation) {
              const innerConv = conversationArray.conversation;
              // Check if inner conversation has messages array (new format)
              if (innerConv && typeof innerConv === "object" && !Array.isArray(innerConv) && innerConv.messages && Array.isArray(innerConv.messages)) {
                conversationArray = innerConv.messages;
              } 
              // Check if inner conversation is an array 
              else if (Array.isArray(innerConv)) {
                conversationArray = innerConv;
              } else {
                conversationArray = [];
              }
            }
            // Direct new format: { messages: [...], state: null, pendingData: {} }
            else if (conversationArray.messages && Array.isArray(conversationArray.messages)) {
              conversationArray = conversationArray.messages;
            } else {
              conversationArray = [];
            }
          } else {
            conversationArray = [];
          }

          if (!Array.isArray(conversationArray)) {
            conversationArray = [];
          }

          const first = conversationArray.find(m => m.role === "user") || conversationArray[0];
          const title = first?.content?.slice(0, 40) || "Conversation";

          return {
            id: chat.id,
            timestamp: chat.createdAt,
            title,
            messages: conversationArray.map(msg => ({
              role: msg.role,
              text: msg.content
            }))
          };
        });

        setHistory(formatted);
      } catch {}
    };

    fetchHistory();
  }, [userId]);

  const loadConversation = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await handleGetConversation(userId);

      if (response.conversation && response.conversation.length > 0) {
        const loadedMessages = response.conversation.map(msg => ({
          role: msg.role,
          text: msg.content
        }));
        setMessages(loadedMessages);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError("Failed to load conversation.");
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadConversation();
  }, [userId, loadConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

    useEffect(() => {
      const slotsAdded = search.get("slotsAdded");
      if (!slotsAdded) return;

      const alertSignature = `slots:${slotsAdded}`;
      if (processedAlerts.has(alertSignature)) {
        console.log("Skipping duplicate alert:", alertSignature);
        return;
      }
      window.alert(`You added ${slotsAdded} to your availability.`);
      processedAlerts.add(alertSignature);
      //prevent retriggering
      const params = new URLSearchParams(location.search);
      params.delete("slotsAdded");
      const newSearch = params.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }, [search, location.pathname, processedAlerts]);

  const loadConversationFromHistory = async chat => {
    if (!chat?.messages || !userId) return;
    
    try {
      // Load conversation into backend store
      await handleLoadConversationFromDB(chat.id, userId);
      
      // Update frontend display
      setMessages(chat.messages);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      // Still update frontend display even if backend load fails
      setMessages(chat.messages);
    }
  };

  /**
   * Main function to send either text input or a recorded audio blob.
   * @param {Event} e The form submit event.
   */
  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();

    // Determine what to send: Audio or Text
    const isAudioSubmission = !!audioBlob;

    if (!isAudioSubmission && !trimmedInput) return;
    
    // If sending audio, clear text input state
    if (isAudioSubmission) setInput("");

    setError(null);
    setIsLoading(true);

    // Add a placeholder message for the user's action
    const userMessage = isAudioSubmission 
        ? { role: "user", text: "[Sent Audio Message]" } 
        : { role: "user", text: trimmedInput };
        
    setMessages(m => [...m, userMessage]);
    
    // Clear audio blob after queuing the message
    setAudioBlob(null);

    try {
        let response;
        if (isAudioSubmission) {
            response = await handleChatWithAssistant(null, audioBlob, userId, chatId);
        } else {
            response = await handleChatWithAssistant(trimmedInput, null, userId, chatId);
            console.log(response);
        }
        const reply = response.reply || "I'm sorry, I couldn't process that.";

        setMessages(m => [...m, { role: "assistant", text: reply }]);
        
        // Clear text input after successfully sending message
        if (!isAudioSubmission) {
          setInput("");
        }
    } catch (err) {
      console.log(`API Error: ${err.response?.data?.error}`);
      const msg = "Sorry! There was an error on the backend, so I can't respond right now. Please try again or contact an administrator.";
      console.log(`Message: ${msg}`);
      setMessages(m => [...m, { role: "assistant", text: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🗣️ MEDIA RECORDER LOGIC 🗣️
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        setAudioBlob(null); // Clear previous audio
        setInput(""); // Clear text input while recording

        mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioBlob(audioBlob);
            setIsRecording(false);
            
            // Cleanup stream tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Now that we have the blob, automatically submit the message
            // Create a mock event for sendMessage
            const autoSendEvent = { preventDefault: () => {} };
            sendMessage(autoSendEvent);
        };

        mediaRecorder.onerror = (event) => {
            console.error('Recording error:', event.error);
            setIsRecording(false);
            setError(`Recording error: ${event.error.name}`);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setError(null);

    } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Please allow microphone access to record audio.");
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  // 🗣️ END MEDIA RECORDER LOGIC 🗣️


  const handleSave = async () => {
    // ... (handleSave remains the same)
    if (!userId) return;

    try {
      await handleSaveConversation(userId);

      const newItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        title: messages.find(m => m.role === "user")?.text?.slice(0, 40) || "Conversation",
        messages: [...messages]
      };

      setHistory(prev => [newItem, ...prev]);

      const updated = await handleGetAllAIChats(userId);

      if (updated?.chats) {
        const formatted = updated.chats.map(chat => {
          let arr = chat.conversation;
          if (typeof arr === "string") {
            try { arr = JSON.parse(arr); } catch { arr = []; }
          }
          
          // If already an array (old format), use it directly
          if (Array.isArray(arr)) {
            // Already in correct format, continue
          }
          // Handle object formats
          else if (arr && typeof arr === "object") {
            // Format: { conversation: { messages: [...], state: null, pendingData: {} } }
            // OR Format: { conversation: [...] } (old format wrapped)
            if (arr.conversation) {
              const innerConv = arr.conversation;
              // Check if inner conversation has messages array (new format)
              if (innerConv && typeof innerConv === "object" && !Array.isArray(innerConv) && innerConv.messages && Array.isArray(innerConv.messages)) {
                arr = innerConv.messages;
              } 
              // Check if inner conversation is an array (old format wrapped)
              else if (Array.isArray(innerConv)) {
                arr = innerConv;
              } else {
                arr = [];
              }
            }
            // Direct new format: { messages: [...], state: null, pendingData: {} }
            else if (arr.messages && Array.isArray(arr.messages)) {
              arr = arr.messages;
            } else {
              arr = [];
            }
          } else {
            arr = [];
          }
          
          if (!Array.isArray(arr)) arr = [];
          const first = arr.find(m => m.role === "user") || arr[0];
          return {
            id: chat.id,
            timestamp: chat.createdAt,
            title: first?.content?.slice(0, 40) || "Conversation",
            messages: arr.map(msg => ({ role: msg.role, text: msg.content }))
          };
        });
        setHistory(formatted);
      }

      alert("Conversation saved!");
    } catch (err) {
      alert("Failed to save conversation.");
    }
  };

  const handleClear = async () => {
    // ... (handleClear remains the same)
    if (!userId) return;

    if (!window.confirm("Clear conversation?")) return;

    try {
      await handleClearConversation(userId);
      setMessages([
        { role: "assistant", text: "Hi! I'm your Chat Assistant. How can I help?" }
      ]);
      setAudioBlob(null);
      alert("Conversation cleared.");
    } catch {
      alert("Failed to clear conversation.");
    }
  };

  return (
    <div className="assistant-wrap">
      <div className="assistant-layout">

        <div className="assistant-sidebar">
            {/* ... (Sidebar remains the same) */}
          <div className="sidebar-header">
            <h3>Conversations</h3>
          </div>

          <div className="sidebar-list">
            {history.length === 0 && (
              <p className="empty">No previous conversations</p>
            )}

            {history.map(chat => (
              <div 
                key={chat.id} 
                className="sidebar-item"
                onClick={() => loadConversationFromHistory(chat)}
              >
                <strong>{chat.title}</strong>
                <p className="timestamp">
                  {new Date(chat.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="assistant-card">

          <div className="assistant-header">
            <div className="assistant-title">Chat Assistant</div>
            <div className="assistant-meta">
              {userId ? `User ID: ${userId}` : ""}
            </div>
          </div>

          {error && (
            <div className="alert alert-warning">{error}</div>
          )}
          
          {isRecording && (
            <div className="alert alert-danger blink-text">🔴 Recording... Click the button again to stop.</div>
          )}
          {audioBlob && !isRecording && (
              <div className="alert alert-success">✅ Audio recorded! Hit the send button to send it.</div>
          )}


          <div className="assistant-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role === "user" ? "from-user" : "from-assistant"}`}>
                <div className="msg-bubble">
                  <ReactMarkdown>{highlightGoals(m.text)}</ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="msg-row from-assistant">
                <div className="msg-bubble">Thinking...</div>
              </div>
            )}
          </div>

          <form className="assistant-inputbar" onSubmit={sendMessage}>
            
            {/* 🎙️ Microphone Button (for recording audio) 🎙️ */}
            <Button 
                variant={isRecording ? "danger" : "primary"}
                onClick={toggleRecording}
                className="assistant-mic"
                disabled={isLoading}
                style={{ marginRight: "10px" }}
                title={isRecording ? "Stop Recording" : "Start Audio Recording"}
            >
                {isRecording ? "◼️ Stop" : "🎤 Record"}
            </Button>
            {/* -------------------------------------- */}

            <input
              className="assistant-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setAudioBlob(null); // Clear audio blob if user starts typing
              }}
              placeholder="Message Chat Assistant…"
              disabled={isLoading || isRecording}
            />
            <Button 
                type="submit" 
                className="assistant-send" 
                disabled={isLoading || (!input.trim() && !audioBlob)}
            >
              {isLoading ? "Sending…" : (audioBlob ? "Send Audio" : "Send")}
            </Button>
          </form>

          <div className="assistant-footer">
            <Button variant="secondary" onClick={() => navigate(`/Dashboard?id=${userId}`)}>
              Back
            </Button>
            <Button
                variant="primary"
                style={{ marginLeft: "10px" }}
                onClick={() => {
                  console.log("Navigating to AvailabilityPicker for userId:", userId);
                  navigate(`/AvailabilityPicker?id=${userId}&returnTo=Assistant`);
                }}
              >
                Select Availability
              </Button>

            <Button variant="success" onClick={handleSave} style={{ marginLeft: "10px" }}>
              Save to History
            </Button>

            <Button variant="danger" onClick={handleClear} style={{ marginLeft: "10px" }}>
              Clear Conversation
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
