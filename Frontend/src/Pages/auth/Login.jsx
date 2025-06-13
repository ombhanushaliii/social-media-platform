import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import logo from "../../assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Hardcoded credentials
      if (email === "user@whizmedia.com" && password === "user@123") {
        const userData = {
          email: "user@whizmedia.com",
          name: "Whizmedia User"
        };
        login(userData, "hardcoded-token");
        navigate("/dashboard");
      } else {
        setError("Invalid email or password. Use user@whizmedia.com and user@123");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {/* Left Panel */}
      <div className="w-full md:w-1/2 bg-black flex items-center justify-center px-6 py-12">
        <div className="w-80">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back 👋</h2>
          <p className="text-sm text-gray-400 mb-6">Login to your dashboard</p>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-80 bg-neutral-900 text-white pl-10 pr-4 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-80 bg-neutral-900 text-white pl-10 pr-12 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-800/20 text-red-400 text-sm p-3 rounded-md border border-red-700">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-80 bg-[#4502fa] hover:bg-[#3601d4] text-white py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? "Signing in..." : (
                <div className="flex items-center justify-center gap-2">
                  <span>Login</span> <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative bg-black">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 85% 30%, rgba(0, 85, 255, 0.7), rgba(0, 0, 0, 0) 60%), #000`,
          }}
        />
        <div className="relative z-10 text-center px-10">
          <h1 className="text-white text-4xl font-extrabold mb-4 leading-tight">
            Welcome to <br />
            <span className="text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              The Best Social Media Management Platform
            </span>
          </h1>
          <p className="text-gray-300 text-md">Manage, schedule and grow — all in one place.</p>

          <div className="mt-8">
            <div className="w-40 h-40 mx-auto flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center animate-pulse bg-white/5 backdrop-blur">
                  <div className="text-white text-2xl font-bold">
                    <img src={logo} alt=""/>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/20 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-white/30 rounded-full animate-bounce delay-1000"></div>
                <div className="absolute top-1/2 -right-4 w-3 h-3 bg-white/25 rounded-full animate-bounce delay-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
