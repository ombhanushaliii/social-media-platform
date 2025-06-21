import { useState } from "react";
import { Upload, Image as ImageIcon, Type, Send, X, Loader, Linkedin } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LinkedInPostCreator = ({ isDarkMode, onClose, onPostSuccess }) => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    input: isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
        setError("");
      } else {
        setError("Please select an image file");
      }
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      setError("Please write some content for your LinkedIn post");
      return;
    }

    if (!user?.linkedinAccessToken) {
      setError("LinkedIn authentication required. Please log in with LinkedIn.");
      return;
    }

    setIsPosting(true);
    setError("");

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      formData.append('content', content);
      formData.append('linkedinAccessToken', user.linkedinAccessToken);
      formData.append('authorId', user.linkedinId || user.id);

      console.log('Posting to LinkedIn via backend...'); // Debug log

      const response = await fetch('https://whizmedia-backend.onrender.com/user/linkedin/post', {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (data.success) {
        onPostSuccess && onPostSuccess({
          ...data,
          platform: 'linkedin',
          content: content
        });
        // Reset form
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        onClose && onClose();
      } else {
        setError(data.error || "Failed to post to LinkedIn");
      }
    } catch (err) {
      console.error('LinkedIn post error:', err);
      
      // Better error messages
      if (err.message.includes('CORS')) {
        setError("CORS error: Backend not allowing frontend requests. Please check server configuration.");
      } else if (err.message.includes('NetworkError')) {
        setError("Network error: Unable to reach backend server. Please check if backend is running.");
      } else if (err.message.includes('fetch')) {
        setError("Connection error: Please check your internet connection and try again.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-xl w-full max-w-lg`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Create LinkedIn Post</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${themeClasses.textSecondary}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Platform Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <span className={`font-medium ${themeClasses.text}`}>LinkedIn</span>
            <span className={`text-sm ${themeClasses.textSecondary}`}>• {user?.name || 'Professional Network'}</span>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
              )}
              <div>
                <p className={`font-medium ${themeClasses.text}`}>{user.name}</p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Posting to LinkedIn • Public
                </p>
              </div>
            </div>
          )}

          {/* Content Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
              <Type className="h-4 w-4 inline mr-2" />
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts with your network... #LinkedIn #Professional"
              rows={5}
              className={`w-full p-3 ${themeClasses.input} border rounded-lg focus:border-blue-500 focus:outline-none resize-none`}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${themeClasses.textSecondary}`}>
                {content.length}/3000 characters
              </span>
              <span className={`text-xs ${themeClasses.textSecondary}`}>
                Add relevant hashtags for better reach
              </span>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Image (Optional)
            </label>
            
            {!previewUrl ? (
              <div className={`border-2 border-dashed ${themeClasses.border} rounded-lg p-6 text-center hover:border-blue-500 transition-colors`}>
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${themeClasses.textSecondary}`}>
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${themeClasses.text}`}>
                    Drop your image here, or 
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                      browse
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-800/20 text-red-400 text-sm p-3 rounded-md border border-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isPosting}
            className={`px-4 py-2 rounded-lg transition-colors ${themeClasses.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={isPosting || !content.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {isPosting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Linkedin className="h-4 w-4" />
                <span>Post to LinkedIn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPostCreator;