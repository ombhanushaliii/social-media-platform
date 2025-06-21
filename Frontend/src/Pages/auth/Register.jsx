import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const passwordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "text-red-500" };
  if (score === 2 || score === 3) return { label: "Medium", color: "text-yellow-400" };
  return { label: "Strong", color: "text-green-500" };
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passStrength, setPassStrength] = useState({ label: "", color: "" });

  useEffect(() => {
    setPassStrength(passwordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError("Username must be 3-20 characters and contain only letters, numbers, and underscores");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      login({
        uid: data.user.uid,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        instagramAccess: data.user.instagramAccess,
        linkedinConnected: data.user.linkedinConnected || false
      }, data.user.token);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <div className="w-full md:w-1/2 bg-black flex items-center justify-center px-6 py-8 overflow-hidden">
        <div className="w-80 h-full flex flex-col justify-center">
          <div className="mb-4 flex justify-center">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Create Your Account 👋</h2>
          <p className="text-sm text-gray-400 mb-4">Register to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                name="username"
                value={formData.username}
                required
                onChange={handleInputChange}
                placeholder="Username"
                className="w-80 bg-neutral-900 text-white pl-10 pr-4 py-2.5 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none transition-all duration-200"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                required
                onChange={handleInputChange}
                placeholder="Email"
                className="w-80 bg-neutral-900 text-white pl-10 pr-4 py-2.5 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                required
                onChange={handleInputChange}
                placeholder="Password"
                className="w-80 bg-neutral-900 text-white pl-10 pr-12 py-2.5 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {formData.password && (
              <p className={`text-sm font-medium ${passStrength.color}`}>
                Password Strength: {passStrength.label}
              </p>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                required
                onChange={handleInputChange}
                placeholder="Confirm Password"
                className="w-80 bg-neutral-900 text-white pl-10 pr-12 py-2.5 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-800/20 text-red-400 text-sm p-3 rounded-md border border-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-80 bg-[#4502fa] hover:bg-[#3601d4] text-white py-2.5 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                "Creating account..."
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Register</span> <ArrowRight size={18} />
                </div>
              )}
            </button>

            <div className="mt-4 text-left text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-[#4502fa] hover:underline font-medium">
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 85% 30%, rgba(0, 85, 255, 0.7), rgba(0, 0, 0, 0) 60%), #000`,
          }}
        />
        <div className="relative z-10 text-center px-10">
          <h1 className="text-white text-3xl font-extrabold mb-4">
            Join <br />
            <span className="text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              The Best Social Media Management Platform
            </span>
          </h1>
          <p className="text-gray-300 text-sm">
            Empowering connections with seamless experiences.
            <br />
            Start your journey with us.
          </p>

          <div className="mt-8">
            <div className="w-36 h-36 mx-auto flex items-center justify-center">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-full border-4 border-white/20 flex items-center justify-center animate-pulse"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="text-white text-xl font-bold">
                    <img src={logo} alt="logo" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/20 rounded-full animate-bounce" />
                <div
                  className="absolute -bottom-3 -left-3 w-4 h-4 bg-white/30 rounded-full animate-bounce"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="absolute top-1/2 -right-4 w-3 h-3 bg-white/25 rounded-full animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;