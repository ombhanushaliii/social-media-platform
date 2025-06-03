import { useState } from "react";
import {
  MenuIcon,
  LogoutIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  CalendarIcon,
  PlusIcon,
} from "@heroicons/react/outline";
import { Tooltip } from "react-tooltip";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";


const navItems = [
  { id: "overview", name: "Overview", icon: HomeIcon },
  { id: "clients", name: "Clients", icon: UsersIcon },
  { id: "employees", name: "Employees", icon: UserGroupIcon },
  { id: "calendars", name: "Calendars", icon: CalendarIcon },
];

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [clients, setClients] = useState([
    {
      id: 1,
      name: "Client A",
      managerId: 1,
      platforms: ["Facebook", "Instagram"],
      company: "ABC Corp",
      occupation: "Marketing",
      links: ["https://fb.com"],
    },
    {
      id: 2,
      name: "Client B",
      managerId: 2,
      platforms: ["Twitter"],
      company: "XYZ Inc",
      occupation: "Sales",
      links: ["https://twitter.com"],
    },
  ]);

  const navigate = useNavigate();

  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    occupation: "",
    platforms: "",
    links: [""],
  });

  // For editing client details
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(null);

const { logout } = useAuth();


const handleLogout = () => {
  logout();                 // clears user + token from context + localStorage
  navigate("/login");      // redirects to login
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
      },
    ]);
    setShowAddClientModal(false);
    setNewClient({ name: "", company: "", occupation: "", platforms: "", links: [""] });
  };

  // Handle editing input changes for client details
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

  return (
    <div className="flex h-screen bg-gray-100 transition-all duration-300">
      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white h-full p-4 flex flex-col justify-between transition-all duration-300 ease-in-out
        ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        <div>
          <button
            className="mb-6 p-2 rounded-md bg-gray-700 text-white w-full flex items-center justify-between"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <nav className="flex flex-col space-y-2">
            {navItems.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                data-tooltip-id={id}
                data-tooltip-content={name}
                className={`flex items-center p-2 rounded transition-colors duration-200 
                ${activeSection === id ? "bg-purple-700" : "hover:bg-purple-600"}`}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && <span className="ml-2">{name}</span>}
                {!sidebarOpen && <Tooltip id={id} place="right" />}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center p-2 rounded bg-red-600 hover:bg-red-700 transition duration-200"
        >
          <LogoutIcon className="h-5 w-5" />
          {sidebarOpen && <span className="ml-2">Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 transition-all duration-300">
        {activeSection === "overview" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Welcome to the Manager Dashboard</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddClientModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" /> Add Client
              </button>
            </div>
          </div>
        )}

        {activeSection === "clients" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Clients</h2>
            <ul className="space-y-2 max-w-md">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className={`p-3 border rounded cursor-pointer shadow-sm transition-colors ${
                    selectedClient?.id === client.id ? "bg-purple-100 border-purple-400" : "bg-white border-gray-300 hover:bg-purple-50"
                  }`}
                  onClick={() =>
                    setSelectedClient(selectedClient?.id === client.id ? null : client)
                  }
                >
                  <div className="font-medium text-lg">{client.name}</div>
                  <div className="text-sm text-gray-600">{client.company}</div>
                </li>
              ))}
            </ul>

            {selectedClient && (
              <div className="mt-6 p-6 bg-white rounded shadow max-w-2xl border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{selectedClient.name}</h3>
                  {!isEditing && (
                    <button
                      onClick={handleEditClick}
                      className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-white"
                    >
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={handleSaveClick}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
                    >
                      Save
                    </button>
                  )}
                </div>

                {/* Editable Form or View Mode */}
                {!isEditing ? (
                  <>
                    <p className="mb-2">
                      <strong>Company:</strong> {selectedClient.company}
                    </p>
                    <p className="mb-2">
                      <strong>Occupation:</strong> {selectedClient.occupation}
                    </p>
                    <p className="mb-2">
                      <strong>Platforms:</strong> {selectedClient.platforms.join(", ")}
                    </p>
                    <div>
                      <strong>Links:</strong>
                      <ul className="list-disc ml-6 mt-1">
                        {selectedClient.links.map((link, i) => (
                          <li key={i}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block font-semibold mb-1">Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={editedClient.name}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block font-semibold mb-1">Company:</label>
                      <input
                        type="text"
                        name="company"
                        value={editedClient.company}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block font-semibold mb-1">Occupation:</label>
                      <input
                        type="text"
                        name="occupation"
                        value={editedClient.occupation}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block font-semibold mb-1">
                        Platforms (comma separated):
                      </label>
                      <input
                        type="text"
                        name="platforms"
                        value={editedClient.platforms.join(", ")}
                        onChange={handleEditPlatformChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Links:</label>
                      {editedClient.links.map((link, i) => (
                        <input
                          key={i}
                          type="text"
                          value={link}
                          onChange={(e) => handleEditLinkChange(i, e.target.value)}
                          placeholder="Link URL"
                          className="w-full mb-2 p-2 border rounded"
                        />
                      ))}
                      <button
                        onClick={addEditLinkField}
                        className="text-blue-600 hover:underline"
                      >
                        + Add Link
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Client Modal */}
        {showAddClientModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Add New Client</h3>
              <input
                name="name"
                onChange={handleClientInputChange}
                value={newClient.name}
                placeholder="Client Name"
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                name="company"
                onChange={handleClientInputChange}
                value={newClient.company}
                placeholder="Company Name"
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                name="occupation"
                onChange={handleClientInputChange}
                value={newClient.occupation}
                placeholder="Company Occupation"
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                name="platforms"
                onChange={handleClientInputChange}
                value={newClient.platforms}
                placeholder="Social Media Presence (comma separated)"
                className="w-full mb-2 p-2 border rounded"
              />
              <label className="block font-medium mt-2">Social Media Links:</label>
              {newClient.links.map((link, i) => (
                <input
                  key={i}
                  value={link}
                  onChange={(e) => handleLinkChange(i, e.target.value)}
                  placeholder="Link URL"
                  className="w-full mb-2 p-2 border rounded"
                />
              ))}
              <button onClick={addNewLinkField} className="text-blue-600 mb-2">
                + Add Link
              </button>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={submitNewClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
