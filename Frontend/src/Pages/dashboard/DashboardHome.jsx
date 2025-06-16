import { useState, useRef, useEffect } from "react";
import { LogOut, Home, Users, UserCheck, Calendar, Sun, Moon, BarChart3, FileText, Plus, Instagram, Linkedin, Clock, CheckCircle, ChevronDown } from "lucide-react";
import PostCreator from "../../Components/PostCreator";
import LinkedInPostCreator from "../../Components/LinkedInPostCreator";
import { useAuth } from "../../Context/AuthContext";

const navItems = [
  { id: "overview", name: "Overview", icon: Home },
  { id: "employees", name: "Employees", icon: UserCheck },
  { id: "content", name: "Content", icon: FileText },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "calendar", name: "Calendar", icon: Calendar },
];

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showLinkedInCreator, setShowLinkedInCreator] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [posts, setPosts] = useState([]);
  const sidebarRef = useRef(null);
  const { user, login } = useAuth();
  
  const [clients, setClients] = useState([
    {
      id: 1,
      name: "Fashion Forward",
      managerId: 1,
      platforms: ["Instagram", "LinkedIn"],
      company: "Fashion Forward",
      occupation: "Fashion Retail",
      links: ["https://www.instagram.com/notacatfish77/"],
      igName: "USer",
      status: "Active"
    }
  ]);

  const [expandedClientId, setExpandedClientId] = useState(null);

  // Theme classes
  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    input: isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300',
    clientIcon: isDarkMode ? 'bg-white text-black' : 'bg-gray-900 text-white',
  };

  // Listen for LinkedIn callback (token in URL) - FIXED useEffect
  useEffect(() => {
    // Handle LinkedIn popup messages
    const handleMessage = (event) => {
      // Verify origin for security
      if (event.origin !== 'https://whizmedia-backend.onrender.com') {
        return;
      }
      
      if (event.data.type === 'LINKEDIN_SUCCESS') {
        const linkedinUserData = event.data.userData;
        
        // Merge LinkedIn data with existing user data
        const updatedUser = {
          ...user, // Keep existing user data (email login)
          ...linkedinUserData, // Add LinkedIn data
          provider: user?.provider || 'email', // Keep original provider
          linkedinConnected: true
        };
        
        login(updatedUser, linkedinUserData.linkedinAccessToken);
        console.log('LinkedIn connected successfully via popup!', updatedUser);
      }
    };
    
    // Add event listener for popup messages
    window.addEventListener('message', handleMessage);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [user, login]);

  // Fallback: Handle LinkedIn connection from URL token (backup method)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedinConnected = params.get("linkedin_connected");
    
    if (linkedinConnected === "true") {
      const storedLinkedinData = sessionStorage.getItem('linkedin_user_data');
      if (storedLinkedinData) {
        try {
          const linkedinUserData = JSON.parse(storedLinkedinData);
          
          const updatedUser = {
            ...user,
            ...linkedinUserData,
            provider: user?.provider || 'email',
            linkedinConnected: true
          };
          
          login(updatedUser, linkedinUserData.linkedinAccessToken);
          sessionStorage.removeItem('linkedin_user_data');
          console.log('LinkedIn connected via sessionStorage fallback!');
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error parsing LinkedIn data from sessionStorage:', error);
        }
      }
    }
  }, []);

  // Handle client selection from sidebar
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setActiveSection("overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (selectedClient) {
      setSelectedClient(null);
    }
  };

  const handlePostSuccess = (postData) => {
    const newPost = {
      id: Date.now(),
      platform: postData.platform || 'instagram',
      imageUrl: postData.imageUrl,
      content: postData.content || postData.caption,
      postId: postData.instagramPostId || postData.linkedinPostId,
      createdAt: new Date().toISOString(),
      status: 'published'
    };
    setPosts([newPost, ...posts]);
  };

  const handleCreatePost = (platform) => {
    setShowPlatformDropdown(false);
    if (platform === 'instagram') {
      setShowPostCreator(true);
    } else if (platform === 'linkedin') {
      if (user?.linkedinAccessToken) {
        setShowLinkedInCreator(true);
      } else {
        alert('Please connect your LinkedIn account first');
      }
    }
  };

  // LinkedIn connect handler
  const handleLinkedInConnect = () => {
    const clientId = '776rnhewhggkqz'; // Use the correct client ID from your .env
    const redirectUri = 'https://whizmedia-backend.onrender.com/user/auth/linkedin/callback';
    const scope = 'profile%20w_member_social';
    const state = Math.random().toString(36).substring(2, 15);

    localStorage.setItem('linkedin_state', state);

    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`;

    console.log('Opening LinkedIn popup...');
    
    // Open popup
    const popup = window.open(
      linkedinAuthUrl,
      'linkedin-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes,left=' + 
      (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 350)
    );
    
    // Check if popup was blocked
    if (!popup || popup.closed) {
      alert('Popup blocked! Please allow popups for this site and try again.');
      return;
    }
    
    // Monitor popup
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('LinkedIn popup closed');
      }
    }, 1000);
    
    // Timeout fallback
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        console.log('LinkedIn popup timed out');
      }
    }, 300000); // 5 minutes timeout
  };

  // Add this right after the user state updates
  useEffect(() => {
    console.log('Current user state:', user);
    console.log('LinkedIn access token present:', !!user?.linkedinAccessToken);
  }, [user]);

  return (
    <div 
      className={`flex flex-col h-screen ${themeClasses.bg} ${themeClasses.text} transition-all duration-300`}
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Top Navigation */}
      <header className={`${themeClasses.cardBg} ${themeClasses.border} border-b z-10 relative`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-600">Whizmedia</h1>
              
              {/* LinkedIn Connection Status - In the header */}

            </div>

            {/* Navigation Items */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSectionChange(id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium
                  ${activeSection === id 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : `${themeClasses.hover} ${themeClasses.textSecondary}`
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {name}
                </button>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden px-6 pb-4">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap
                ${activeSection === id 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : `${themeClasses.hover} ${themeClasses.textSecondary}`
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Client Sidebar - Always visible */}
        <div 
          ref={sidebarRef}
          className={`hidden md:flex md:static z-30 md:z-auto ${themeClasses.border} ${themeClasses.cardBg} border-r w-64 flex-col`}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-lg">Clients</h3>
          </div>
          <div className="overflow-y-auto flex-grow">
            {clients.map(client => (
              <div key={client.id}>
                {/* Client header row */}
                <div
                  className={`p-4 cursor-pointer flex items-center space-x-3 border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 ${
                    selectedClient?.id === client.id || expandedClientId === client.id
                      ? isDarkMode
                        ? 'bg-[#23293a]' // dark blue-gray for selected in dark mode
                        : 'bg-blue-100' // light blue for selected in light mode
                      : isDarkMode
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                >
                  <div className={`w-10 h-10 ${themeClasses.clientIcon} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="font-medium text-sm">{client.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{client.name}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedClientId === client.id ? 'rotate-180' : ''} ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                </div>
                {/* Dropdown for this client */}
                {expandedClientId === client.id && (
                  <div className="px-6 py-4 bg-white dark:bg-[#23293a] border-b border-gray-200 dark:border-gray-700 shadow-md rounded-b-lg flex items-center space-x-3">
                    {/* LinkedIn Button Logic (only here) */}
                    {user?.linkedinAccessToken ? (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-200">
                          {user.name || user.firstName || "LinkedIn User"}
                        </span>
                        <button
                          onClick={() => setShowLinkedInCreator(true)}
                          className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all shadow"
                        >
                          Post
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleLinkedInConnect}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full font-medium transition-all shadow border border-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-white dark:border-blue-400"
                      >
                        <Linkedin className="w-5 h-5 text-white" />
                        Connect LinkedIn
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Content Header - show client info if selected */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              {selectedClient ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{selectedClient.name}</h1>
                    <p className={themeClasses.textSecondary}>
                      {selectedClient.occupation} • {selectedClient.platforms.join(', ')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)} 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">
                    {navItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
                  </h1>
                  <p className={themeClasses.textSecondary}>
                    {activeSection === 'overview' && 'Welcome back! Here\'s what\'s happening with Fashion Forward.'}
                    {activeSection === 'employees' && 'Team management and assignments.'}
                    {activeSection === 'content' && 'Create and manage your social media content for Fashion Forward.'}
                    {activeSection === 'analytics' && 'Track your performance and insights.'}
                    {activeSection === 'calendar' && 'View your content calendar and schedule.'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Content - show client details if selected */}
          <div className="p-6">
            {selectedClient ? (
              <div className="max-w-7xl mx-auto">
                <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-sm`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Client Details</h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className={`${themeClasses.textSecondary} text-sm font-medium`}>Company</label>
                        <p className="mt-1">{selectedClient.company}</p>
                      </div>
                      <div>
                        <label className={`${themeClasses.textSecondary} text-sm font-medium`}>Industry</label>
                        <p className="mt-1">{selectedClient.occupation}</p>
                      </div>
                      <div>
                        <label className={`${themeClasses.textSecondary} text-sm font-medium`}>Platforms</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedClient.platforms.map((platform, i) => (
                            <span key={i} className={`px-2 py-1 rounded-lg text-sm ${
                              platform === 'Instagram' ? 'bg-pink-100 text-pink-800' : 
                              platform === 'LinkedIn' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={`${themeClasses.textSecondary} text-sm font-medium`}>Instagram Account</label>
                        <div className="space-y-1 mt-1">
                          <p className="text-sm font-medium">{selectedClient.igName}</p>
                          <a
                            href={selectedClient.links[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-800 text-sm transition-colors"
                          >
                            {selectedClient.links[0]}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeSection === "overview" && (
                  <div className="max-w-7xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className={`${themeClasses.cardBg} ${themeClasses.border} p-6 rounded-xl border shadow-sm`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${themeClasses.textSecondary} text-sm font-medium`}>Active Campaigns</p>
                            <p className="text-3xl font-bold mt-1">8</p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className={`${themeClasses.cardBg} ${themeClasses.border} p-6 rounded-xl border shadow-sm`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${themeClasses.textSecondary} text-sm font-medium`}>Posts This Month</p>
                            <p className="text-3xl font-bold mt-1">{24 + posts.length}</p>
                          </div>
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className={`${themeClasses.cardBg} ${themeClasses.border} p-6 rounded-xl border shadow-sm`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${themeClasses.textSecondary} text-sm font-medium`}>Engagement Rate</p>
                            <p className="text-3xl font-bold mt-1">12.5%</p>
                          </div>
                          <div className="p-3 bg-pink-100 rounded-lg">
                            <Users className="h-6 w-6 text-pink-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fashion Forward Activity */}
                    <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-sm`}>
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold">Fashion Forward Activity</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 ${themeClasses.clientIcon} rounded-full flex items-center justify-center`}>
                                <span className="font-semibold text-sm">FF</span>
                              </div>
                              <div>
                                <p className="font-medium">Fashion Forward</p>
                                <p className={`${themeClasses.textSecondary} text-sm`}>
                                  Instagram & LinkedIn • Fashion Retail
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                          <div className="pl-13">
                            <p className={`${themeClasses.textSecondary} text-sm`}>
                              Latest campaign: Spring Collection 2024 launched across Instagram & LinkedIn
                            </p>
                            <p className={`${themeClasses.textSecondary} text-xs mt-1`}>
                              2 hours ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "content" && (
                  <div className="max-w-7xl mx-auto">
                    {/* Content Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">Social Media Content</h2>
                          <p className={themeClasses.textSecondary}>Fashion Forward • Multi-Platform</p>
                        </div>
                      </div>
                      
                      {/* Create Post Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Post</span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {showPlatformDropdown && (
                          <div className={`absolute right-0 mt-2 w-48 ${themeClasses.cardBg} ${themeClasses.border} border rounded-lg shadow-lg z-10`}>
                            <button
                              onClick={() => handleCreatePost('instagram')}
                              className={`w-full px-4 py-3 text-left ${themeClasses.hover} flex items-center space-x-3 rounded-t-lg`}
                            >
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                                <Instagram className="h-4 w-4 text-white" />
                              </div>
                              <span className={themeClasses.text}>Instagram Post</span>
                            </button>
                            <button
                              onClick={() => handleCreatePost('linkedin')}
                              className={`w-full px-4 py-3 text-left ${themeClasses.hover} flex items-center space-x-3 rounded-b-lg ${
                                !user?.linkedinAccessToken ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={!user?.linkedinAccessToken}
                            >
                              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                                <Linkedin className="h-4 w-4 text-white" />
                              </div>
                              <span className={themeClasses.text}>
                                LinkedIn Post {!user?.linkedinAccessToken && '(Connect Required)'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Posts */}
                    <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-sm`}>
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold">Recent Posts</h3>
                      </div>
                      <div className="p-6">
                        {posts.length === 0 ? (
                          <div className="text-center py-12">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${themeClasses.textSecondary}`}>
                              <FileText className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                            <p className={`${themeClasses.textSecondary} mb-4`}>
                              Create your first social media post for Fashion Forward
                            </p>
                            <button
                              onClick={() => setShowPlatformDropdown(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Create Post</span>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                              <div key={post.id} className={`${themeClasses.border} border rounded-lg overflow-hidden`}>
                                {post.imageUrl && (
                                  <img
                                    src={post.imageUrl}
                                    alt="Post"
                                    className="w-full h-48 object-cover"
                                  />
                                )}
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      {post.platform === 'instagram' ? (
                                        <Instagram className="h-4 w-4 text-purple-600" />
                                      ) : (
                                        <Linkedin className="h-4 w-4 text-blue-600" />
                                      )}
                                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="text-xs">Published</span>
                                    </div>
                                  </div>
                                  {post.content && (
                                    <p className={`text-sm mb-2 ${themeClasses.textSecondary} line-clamp-2`}>
                                      {post.content}
                                    </p>
                                  )}
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {new Date(post.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!["overview", "content"].includes(activeSection) && (
                  <div className="max-w-7xl mx-auto">
                    <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-sm p-8 text-center`}>
                      <div className={`w-16 h-16 ${themeClasses.textSecondary} mx-auto mb-4 flex items-center justify-center`}>
                        {navItems.find(item => item.id === activeSection)?.icon && 
                          (() => {
                            const Icon = navItems.find(item => item.id === activeSection).icon;
                            return <Icon className="h-8 w-8" />;
                          })()
                        }
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {navItems.find(item => item.id === activeSection)?.name}
                      </h3>
                      <p className={themeClasses.textSecondary}>
                        This section is coming soon. Stay tuned for updates!
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Post Creator Modals */}
      {showPostCreator && (
        <PostCreator
          isDarkMode={isDarkMode}
          onClose={() => setShowPostCreator(false)}
          onPostSuccess={handlePostSuccess}
        />
      )}

      {showLinkedInCreator && (
        <LinkedInPostCreator
          isDarkMode={isDarkMode}
          onClose={() => setShowLinkedInCreator(false)}
          onPostSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;