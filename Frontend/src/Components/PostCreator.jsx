import { useState } from "react";
import { Upload, Image as ImageIcon, Type, Send, X, Loader } from "lucide-react";

const PostCreator = ({ isDarkMode, onClose, onPostSuccess }) => {
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

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
    if (!selectedFile) {
      setError("Please select an image");
      return;
    }

    setIsPosting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('caption', caption);

      const response = await fetch('http://localhost:5000/user/post', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onPostSuccess && onPostSuccess(data);
        // Reset form
        setCaption("");
        setSelectedFile(null);
        setPreviewUrl(null);
        onClose && onClose();
      } else {
        setError(data.error || "Failed to post");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error('Post error:', err);
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
          <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Create New Post</h3>
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IG</span>
            </div>
            <span className={`font-medium ${themeClasses.text}`}>Instagram</span>
            <span className={`text-sm ${themeClasses.textSecondary}`}>• Fashion Forward</span>
          </div>

          {/* Image Upload */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Image
            </label>
            
            {!previewUrl ? (
              <div className={`border-2 border-dashed ${themeClasses.border} rounded-lg p-8 text-center hover:border-blue-500 transition-colors`}>
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

          {/* Caption */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
              <Type className="h-4 w-4 inline mr-2" />
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... #hashtags"
              rows={4}
              className={`w-full p-3 ${themeClasses.input} border rounded-lg focus:border-blue-500 focus:outline-none resize-none`}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${themeClasses.textSecondary}`}>
                {caption.length}/2200 characters
              </span>
              <span className={`text-xs ${themeClasses.textSecondary}`}>
                Add #fashionforward for brand visibility
              </span>
            </div>
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
            disabled={isPosting || !selectedFile}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {isPosting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Post to Instagram</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;