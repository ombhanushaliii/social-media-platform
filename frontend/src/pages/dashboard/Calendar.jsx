import React, { useState } from 'react';
import { Calendar, Clock, Image, Video, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const SocialMediaScheduler = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [formData, setFormData] = useState({
    platform: '',
    time: '',
    mediaFile: null,
    mediaPreview: null,
    mediaType: null
  });

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'pinterest', name: 'Pinterest', color: 'bg-red-600' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'x', name: 'X (Twitter)', color: 'bg-gray-800' }
  ];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const daysInPrevMonth = getDaysInMonth(currentMonth - 1, currentYear);
  
  const calendarDays = [];

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPrevMonth: true
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day: day,
      isCurrentMonth: true,
      isPrevMonth: false,
      isToday: day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
    });
  }

  // Next month's leading days
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day: day,
      isCurrentMonth: false,
      isPrevMonth: false
    });
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentMonth + direction);
    setCurrentDate(newDate);
  };

  const navigateYear = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentYear + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (dayObj) => {
    if (dayObj.isCurrentMonth) {
      setSelectedDate(dayObj.day);
      setShowModal(true);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          mediaFile: file,
          mediaPreview: e.target.result,
          mediaType: file.type.startsWith('image/') ? 'image' : 'video'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSchedulePost = () => {
    if (formData.platform && formData.time && formData.mediaFile) {
      const newPost = {
        id: Date.now(),
        date: selectedDate,
        month: currentMonth,
        year: currentYear,
        platform: formData.platform,
        time: formData.time,
        mediaPreview: formData.mediaPreview,
        mediaType: formData.mediaType,
        fileName: formData.mediaFile.name
      };
      
      setScheduledPosts([...scheduledPosts, newPost]);
      setShowModal(false);
      setFormData({
        platform: '',
        time: '',
        mediaFile: null,
        mediaPreview: null,
        mediaType: null
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      platform: '',
      time: '',
      mediaFile: null,
      mediaPreview: null,
      mediaType: null
    });
  };

  const getPostsForDate = (day) => {
    return scheduledPosts.filter(post => 
      post.date === day && 
      post.month === currentMonth && 
      post.year === currentYear
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto">
        {/* Calendar Container */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-medium text-white">
                {monthNames[currentMonth]} {currentYear}
              </h1>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateYear(-1)}
                  className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
                  title="Previous Year"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 min-w-[60px] text-center">{currentYear}</span>
                <button
                  onClick={() => navigateYear(1)}
                  className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
                  title="Next Year"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-800 rounded-md transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-800 rounded-md transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-800">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-gray-400 border-r border-gray-800 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayObj, index) => {
              const posts = getPostsForDate(dayObj.day);
              return (
                <div
                  key={index}
                  className={`
                    relative h-32 border-r border-b border-gray-800 last:border-r-0
                    ${dayObj.isCurrentMonth ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer' : 'bg-gray-950'}
                    transition-colors duration-150 group
                  `}
                  onClick={() => handleDateClick(dayObj)}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`
                        text-sm font-medium
                        ${dayObj.isCurrentMonth ? 'text-white' : 'text-gray-600'}
                        ${dayObj.isToday ? 'bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                      `}>
                        {dayObj.day}
                      </span>
                      {posts.length > 0 && dayObj.isCurrentMonth && (
                        <div className="bg-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {posts.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Scheduled posts preview */}
                    <div className="flex-1 space-y-1">
                      {posts.slice(0, 3).map(post => (
                        <div key={post.id} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                          {socialPlatforms.find(p => p.id === post.platform)?.name} - {post.time}
                        </div>
                      ))}
                    </div>

                    {/* Hover overlay */}
                    {dayObj.isCurrentMonth && (
                      <div className="
                        absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-90
                        rounded-none transition-all duration-200 opacity-0 group-hover:opacity-100
                        flex items-center justify-center text-white font-medium
                      ">
                        Schedule Post
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Posts Summary */}
        {scheduledPosts.length > 0 && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Scheduled Posts</h3>
            <div className="space-y-3">
              {scheduledPosts.map(post => (
                <div key={post.id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
                  <div className="text-lg font-medium">{post.date}/{post.month + 1}/{post.year}</div>
                  <div className={`px-3 py-1 rounded-full text-sm text-white ${
                    socialPlatforms.find(p => p.id === post.platform)?.color || 'bg-gray-600'
                  }`}>
                    {socialPlatforms.find(p => p.id === post.platform)?.name}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.mediaType === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span className="text-sm text-gray-400">{post.fileName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Schedule Post for {selectedDate}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Platform</label>
                <div className="grid grid-cols-1 gap-2">
                  {socialPlatforms.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setFormData({...formData, platform: platform.id})}
                      className={`
                        p-3 rounded-lg text-left transition-all duration-200
                        ${formData.platform === platform.id 
                          ? `${platform.color} text-white` 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }
                      `}
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Schedule Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Media Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Upload Image or Video</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                />
              </div>

              {/* Media Preview */}
              {formData.mediaPreview && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Preview</label>
                  <div className="bg-gray-800 rounded-lg p-4">
                    {formData.mediaType === 'image' ? (
                      <img 
                        src={formData.mediaPreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video 
                        src={formData.mediaPreview} 
                        controls 
                        className="w-full h-48 rounded-lg"
                      />
                    )}
                    <p className="text-sm text-gray-400 mt-2">{formData.mediaFile?.name}</p>
                  </div>
                </div>
              )}

              {/* Schedule Button */}
              <button
                onClick={handleSchedulePost}
                disabled={!formData.platform || !formData.time || !formData.mediaFile}
                className="
                  w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed
                  text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200
                  flex items-center justify-center space-x-2
                "
              >
                <Check className="w-5 h-5" />
                <span>Schedule Post</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaScheduler;