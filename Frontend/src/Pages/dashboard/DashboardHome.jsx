import { useState, useRef, useEffect } from "react";
import { Menu, LogOut, Home, Users, UserCheck, Calendar, Plus, Edit3, Save, X, Sun, Moon, Settings, BarChart3, FileText } from "lucide-react";
import SocialMediaScheduler from "./Calendar"; 

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
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isClientSidebarVisible, setIsClientSidebarVisible] = useState(false);
  const hamburgerRef = useRef(null);
  const sidebarRef = useRef(null);
  
  const [clients, setClients] = useState([
    {
      id: 1,
      name: "TechCorp Ltd",
      managerId: 1,
      platforms: ["LinkedIn", "Twitter"],
      company: "TechCorp Ltd",
      occupation: "Software Development",
      links: ["https://linkedin.com/company/techcorp"],
      status: "Active"
    },
    {
      id: 2,
      name: "Fashion Forward",
      managerId: 2,
      platforms: ["Instagram", "TikTok"],
      company: "Fashion Forward",
      occupation: "Fashion Retail",
      links: ["https://instagram.com/fashionforward"],
      status: "Active"
    },
    {
      id: 3,
      name: "Green Solutions",
      managerId: 1,
      platforms: ["Facebook", "LinkedIn"],
      company: "Green Solutions",
      occupation: "Environmental Services",
      links: ["https://facebook.com/greensolutions"],
      status: "Pending"
    },
  ]);

  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    occupation: "",
    platforms: "",
    links: [""],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(null);

  // Theme classes
  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    input: isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300',
  };

  // Toggle client sidebar
  const toggleClientSidebar = () => {
    setIsClientSidebarVisible(!isClientSidebarVisible);
  };

  // Handle client selection from sidebar
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setActiveSection("overview"); // Go to overview section when client is selected
    setIsClientSidebarVisible(false); // Close sidebar after selection on mobile/small screens
  };

  // Close sidebar when clicking outside on mobile/small screens
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isClientSidebarVisible && 
        sidebarRef.current && 
        hamburgerRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !hamburgerRef.current.contains(event.target) &&
        window.innerWidth < 768 // Only on mobile screens
      ) {
        setIsClientSidebarVisible(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isClientSidebarVisible]);

  const handleLogout = () => {
    console.log("Logging out...");
  };

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({ ...newClient, [name]: value });
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...newClient.links];
    newLinks[index] = value;
    setNewClient({ ...newClient, links: newLinks });
  };

  const addNewLinkField = () => {
    setNewClient({ ...newClient, links: [...newClient.links, ""] });
  };

  const submitNewClient = () => {
    setClients([
      ...clients,
      {
        id: clients.length + 1,
        name: newClient.name,
        company: newClient.company,
        occupation: newClient.occupation,
        platforms: newClient.platforms.split(",").map((p) => p.trim()),
        managerId: 0,
        links: newClient.links.filter((l) => l.trim() !== ""),
        status: "Active"
      },
    ]);
    setShowAddClientModal(false);
    setNewClient({ name: "", company: "", occupation: "", platforms: "", links: [""] });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClient({ ...editedClient, [name]: value });
  };

  const handleEditPlatformChange = (e) => {
    const platforms = e.target.value.split(",").map((p) => p.trim());
    setEditedClient({ ...editedClient, platforms });
  };

  const handleEditLinkChange = (index, value) => {
    const newLinks = [...editedClient.links];
    newLinks[index] = value;
    setEditedClient({ ...editedClient, links: newLinks });
  };

  const addEditLinkField = () => {
    setEditedClient({ ...editedClient, links: [...editedClient.links, ""] });
  };

  const handleEditClick = () => {
    setEditedClient(selectedClient);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    const updatedClients = clients.map((client) =>
      client.id === editedClient.id ? editedClient : client
    );
    setClients(updatedClients);
    setSelectedClient(editedClient);
    setIsEditing(false);
  };

  // Update the click outside handler to be more precise
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isClientSidebarVisible && 
        sidebarRef.current && 
        hamburgerRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !hamburgerRef.current.contains(event.target)
      ) {
        setIsClientSidebarVisible(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isClientSidebarVisible]);

  // Handle section change with proper state reset
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    // If we're changing sections, ensure we're not in client view mode
    if (selectedClient) {
      setSelectedClient(null);
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen ${themeClasses.bg} ${themeClasses.text} transition-all duration-300`}
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Top Navigation */}
      <header className={`${themeClasses.cardBg} ${themeClasses.border} border-b z-10 relative`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with Hamburger */}
            <div className="flex items-center space-x-3">
              <button 
                ref={hamburgerRef}
                className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
                onClick={toggleClientSidebar}
                aria-label="Toggle clients sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-blue-600">SocialDash</h1>
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
        {/* Client Sidebar - Full height */}
        <div 
          ref={sidebarRef}
          className={`fixed md:static inset-0 z-30 md:z-auto transform ${
            isClientSidebarVisible ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out ${themeClasses.border} ${themeClasses.cardBg} md:border-r w-64 md:${
            isClientSidebarVisible ? 'block' : 'hidden'
          } md:block flex flex-col`}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-lg">Clients</h3>
            <button 
              onClick={toggleClientSidebar}
              className={`md:hidden p-2 rounded-lg ${themeClasses.hover}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-grow">
            {clients.map(client => (
              <div 
                key={client.id}
                onClick={() => handleClientSelect(client)}
                className={`p-4 cursor-pointer ${
                  selectedClient?.id === client.id 
                    ? "bg-blue-100 dark:bg-blue-900" 
                    : `${themeClasses.hover}`
                } flex items-center space-x-3 border-b border-gray-100 dark:border-gray-800`}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {client.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{client.name}</p>
                  <p className={`${themeClasses.textSecondary} text-xs truncate`}>
                    {client.platforms.join(', ')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === 'Active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {client.status}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowAddClientModal(true);
                setIsClientSidebarVisible(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New Client
            </button>
          </div>
        </div>

        {/* Backdrop for mobile */}
        {isClientSidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setIsClientSidebarVisible(false)} 
          />
        )}

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
                    {activeSection === 'overview' && 'Welcome back! Here\'s what\'s happening today.'}
                    {activeSection === 'employees' && 'Team management and assignments.'}
                    {activeSection === 'content' && 'Create and schedule your content.'}
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
                      {!isEditing ? (
                        <button
                          onClick={handleEditClick}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSaveClick}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {!isEditing ? (
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
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={`${themeClasses.textSecondary} text-sm font-medium`}>Links</label>
                          <div className="space-y-1 mt-1">
                            {selectedClient.links.map((link, i) => (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-800 text-sm transition-colors"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className={`block ${themeClasses.textSecondary} text-sm font-medium mb-1`}>Name</label>
                          <input
                            type="text"
                            name="name"
                            value={editedClient.name}
                            onChange={handleEditInputChange}
                            className={`w-full p-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
                          />
                        </div>
                        <div>
                          <label className={`block ${themeClasses.textSecondary} text-sm font-medium mb-1`}>Company</label>
                          <input
                            type="text"
                            name="company"
                            value={editedClient.company}
                            onChange={handleEditInputChange}
                            className={`w-full p-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
                          />
                        </div>
                        <div>
                          <label className={`block ${themeClasses.textSecondary} text-sm font-medium mb-1`}>Industry</label>
                          <input
                            type="text"
                            name="occupation"
                            value={editedClient.occupation}
                            onChange={handleEditInputChange}
                            className={`w-full p-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
                          />
                        </div>
                        <div>
                          <label className={`block ${themeClasses.textSecondary} text-sm font-medium mb-1`}>Platforms</label>
                          <input
                            type="text"
                            value={editedClient.platforms.join(", ")}
                            onChange={handleEditPlatformChange}
                            className={`w-full p-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
                          />
                        </div>
                        <div>
                          <label className={`block ${themeClasses.textSecondary} text-sm font-medium mb-1`}>Links</label>
                          {editedClient.links.map((link, i) => (
                            <input
                              key={i}
                              type="text"
                              value={link}
                              onChange={(e) => handleEditLinkChange(i, e.target.value)}
                              placeholder="Link URL"
                              className={`w-full mb-2 p-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
                            />
                          ))}
                          <button
                            onClick={addEditLinkField}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            + Add Link
                          </button>
                        </div>
                      </div>
                    )}
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
                            <p className="text-3xl font-bold mt-1">12</p>
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
                            <p className="text-3xl font-bold mt-1">156</p>
                          </div>
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl border shadow-sm`}>
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold">Recent Activity</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {clients.slice(0, 3).map((client) => (
                            <div key={client.id} className="flex items-center justify-between py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {client.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{client.name}</p>
                                  <p className={`${themeClasses.textSecondary} text-sm`}>
                                    {client.platforms.join(', ')} • {client.occupation}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                client.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {client.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "calendar" && (
                  <div className="max-w-7xl mx-auto">
                    <SocialMediaScheduler />
                  </div>
                )}
                
                {/* Placeholder for other sections except overview and calendar */}
                {!["overview", "calendar"].includes(activeSection) && (
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


      {/* Add Client Modal - unchanged */}
      {showAddClientModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className={`${themeClasses.cardBg} rounded-xl w-full max-w-md shadow-xl`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add New Client</h3>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                name="name"
                onChange={handleClientInputChange}
                value={newClient.name}
                placeholder="Client Name"
                className={`w-full p-3 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
              />
              <input
                name="company"
                onChange={handleClientInputChange}
                value={newClient.company}
                placeholder="Company Name"
                className={`w-full p-3 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
              />
              <input
                name="occupation"
                onChange={handleClientInputChange}
                value={newClient.occupation}
                placeholder="Industry"
                className={`w-full p-3 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
              />
              <input
                name="platforms"
                onChange={handleClientInputChange}
                value={newClient.platforms}
                placeholder="Platforms (comma separated)"
                className={`w-full p-3 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
              />
              
              <div>
                <label className={`block ${themeClasses.textSecondary} text-sm font-medium mb-2`}>Links</label>
                {newClient.links.map((link, i) => (
                  <input
                    key={i}
                    value={link}
                    onChange={(e) => handleLinkChange(i, e.target.value)}
                    placeholder="Link URL"
                    className={`w-full mb-2 p-3 ${themeClasses.input} border rounded-lg ${themeClasses.text} focus:border-blue-500 focus:outline-none`}
                  />
                ))}
                <button 
                  onClick={addNewLinkField} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  + Add Link
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddClientModal(false)}
                className={`px-4 py-2 ${themeClasses.hover} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={submitNewClient}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;