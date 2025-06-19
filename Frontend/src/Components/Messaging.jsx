import { useState, useEffect } from "react";
import { Send, Paperclip, X, Users, MessageSquare, Plus, Search, User } from "lucide-react";
import { useAuth } from "../Context/AuthContext";

const MessagingCenter = ({ isDarkMode, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newConversationMode, setNewConversationMode] = useState(false);
  const [newRecipients, setNewRecipients] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    input: isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  };

  // Sample connections data (in production, this would come from LinkedIn API)
  const [connections] = useState([
    { id: "ABC123", name: "John Smith", title: "Software Engineer", company: "Tech Corp" },
    { id: "DEF456", name: "Sarah Johnson", title: "Marketing Manager", company: "Brand Co" },
    { id: "GHI789", name: "Mike Chen", title: "Product Designer", company: "Design Studio" },
  ]);

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    conn.company.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) {
      setError("Please enter a message or attach a file");
      return;
    }

    if (!user?.linkedinAccessToken) {
      setError("LinkedIn authentication required");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('body', newMessage);
      formData.append('linkedinAccessToken', user.linkedinAccessToken);
      formData.append('authorId', user.linkedinId || user.id);

      if (selectedConversation) {
        // Reply to existing conversation
        formData.append('thread', selectedConversation.threadId);
      } else if (newConversationMode && newRecipients.length > 0) {
        // New conversation
        formData.append('recipients', JSON.stringify(newRecipients.map(r => r.id)));
        if (newSubject.trim()) {
          formData.append('subject', newSubject);
        }
      } else {
        setError("Please select recipients or a conversation");
        setIsSending(false);
        return;
      }

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const response = await fetch('https://whizmedia-backend.onrender.com/user/messages/send', {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Add message to local state
        const newMsg = {
          id: data.messageId,
          body: newMessage,
          sender: user.name,
          timestamp: new Date().toISOString(),
          attachments: selectedFile ? [selectedFile.name] : []
        };

        setMessages([...messages, newMsg]);
        setNewMessage("");
        setSelectedFile(null);

        if (newConversationMode) {
          // Create new conversation locally
          const newConv = {
            id: data.threadId,
            threadId: data.threadId,
            subject: newSubject || "New conversation",
            participants: newRecipients,
            lastMessage: newMessage,
            timestamp: new Date().toISOString()
          };
          setConversations([newConv, ...conversations]);
          setSelectedConversation(newConv);
          setNewConversationMode(false);
          setNewRecipients([]);
          setNewSubject("");
        }
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch (err) {
      console.error('Message send error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = () => {
    setNewConversationMode(true);
    setSelectedConversation(null);
    setMessages([]);
    setNewRecipients([]);
    setNewSubject("");
    setRecipientSearch("");
  };

  const addRecipient = (connection) => {
    if (!newRecipients.find(r => r.id === connection.id)) {
      setNewRecipients([...newRecipients, connection]);
    }
    setRecipientSearch("");
  };

  const removeRecipient = (recipientId) => {
    setNewRecipients(newRecipients.filter(r => r.id !== recipientId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-xl w-full max-w-4xl h-[600px] flex`}>
        
        {/* Sidebar - Conversations List */}
        <div className={`w-1/3 ${themeClasses.border} border-r flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Messages
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={startNewConversation}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="New Message"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${themeClasses.hover} transition-colors ${themeClasses.textSecondary}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${themeClasses.textSecondary}`} />
                <p className={`${themeClasses.textSecondary} text-sm`}>
                  No conversations yet
                </p>
                <button
                  onClick={startNewConversation}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Start your first conversation
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setNewConversationMode(false);
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : themeClasses.hover
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${themeClasses.text} truncate`}>
                        {conv.subject}
                      </p>
                      <p className={`text-sm ${themeClasses.textSecondary} truncate`}>
                        {conv.participants.map(p => p.name).join(', ')}
                      </p>
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1 truncate`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {newConversationMode ? (
            /* New Conversation Setup */
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className={`text-lg font-semibold ${themeClasses.text}`}>New Message</h4>
              </div>

              {/* Recipient Selection */}
              <div className="p-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    To:
                  </label>
                  
                  {/* Selected Recipients */}
                  {newRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newRecipients.map((recipient) => (
                        <span
                          key={recipient.id}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          {recipient.name}
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search your connections..."
                      className={`w-full pl-10 pr-4 py-2 ${themeClasses.input} border rounded-lg focus:border-blue-500 focus:outline-none`}
                    />
                  </div>

                  {/* Search Results */}
                  {recipientSearch && (
                    <div className={`mt-2 max-h-32 overflow-y-auto ${themeClasses.cardBg} border rounded-lg`}>
                      {filteredConnections.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => addRecipient(connection)}
                          className={`w-full p-3 text-left ${themeClasses.hover} flex items-center space-x-3`}
                        >
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className={`font-medium ${themeClasses.text}`}>{connection.name}</p>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                              {connection.title} at {connection.company}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    Subject (optional):
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Enter subject..."
                    className={`w-full p-2 ${themeClasses.input} border rounded-lg focus:border-blue-500 focus:outline-none`}
                  />
                </div>
              </div>
            </div>
          ) : selectedConversation ? (
            /* Existing Conversation */
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className={`font-semibold ${themeClasses.text}`}>
                  {selectedConversation.subject}
                </h4>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  {selectedConversation.participants.map(p => p.name).join(', ')}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-medium ${themeClasses.text}`}>
                          {message.sender}
                        </span>
                        <span className={`text-xs ${themeClasses.textSecondary}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`${themeClasses.cardBg} p-3 rounded-lg border`}>
                        <p className={themeClasses.text}>{message.body}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${themeClasses.textSecondary}`}>
                              {message.attachments.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No Selection */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                <p className={`${themeClasses.textSecondary}`}>
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}

          {/* Message Input Area */}
          {(newConversationMode || selectedConversation) && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {/* File Attachment Preview */}
              {selectedFile && (
                <div className="mb-3 flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm ${themeClasses.text}`}>{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-3 bg-red-800/20 text-red-400 text-sm p-3 rounded-md border border-red-700">
                  {error}
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className={`w-full p-3 ${themeClasses.input} border rounded-lg focus:border-blue-500 focus:outline-none resize-none`}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  {/* File Attachment Button */}
                  <label className={`p-2 ${themeClasses.hover} rounded-lg cursor-pointer transition-colors`}>
                    <Paperclip className="w-5 h-5 text-gray-500" />
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                  </label>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || (!newMessage.trim() && !selectedFile) || (newConversationMode && newRecipients.length === 0)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter;