import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../config/Firebase";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const Login = () => {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailForLink, setEmailForLink] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
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
      setError(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Send user data to backend for processing
      const response = await fetch('http://localhost:5000/user/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
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
      setError("Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle passwordless login
  const handlePasswordlessLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/user/send-signin-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailForLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send sign-in link');
      }

      localStorage.setItem('emailForSignIn', emailForLink);
      setLinkSent(true);
    } catch (err) {
      setError(err.message || "Failed to send sign-in link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {/* Left Panel */}
      <div className="w-full md:w-1/2 bg-black flex items-center justify-center px-6 py-12">
        <div className="w-80">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back 👋</h2>
          <p className="text-sm text-gray-400 mb-6">Login to your dashboard</p>

          {!showEmailLogin ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              {/* Username/Email */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={identifier}
                  required
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username or Email"
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

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowEmailLogin(true)}
                  className="text-sm text-[#4502fa] hover:underline"
                >
                  Sign in with email link
                </button>
                <Link to="/forgot-password" className="text-sm text-[#4502fa] hover:underline">
                  Forgot Password?
                </Link>
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
          ) : (
            <div className="space-y-5">
              {!linkSent ? (
                <form onSubmit={handlePasswordlessLogin} className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={emailForLink}
                      required
                      onChange={(e) => setEmailForLink(e.target.value)}
                      placeholder="Enter your email"
                      className="w-80 bg-neutral-900 text-white pl-10 pr-4 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-800/20 text-red-400 text-sm p-3 rounded-md border border-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-80 bg-[#4502fa] hover:bg-[#3601d4] text-white py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {isLoading ? "Sending..." : "Send Sign-in Link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmailLogin(false)}
                    className="w-80 text-gray-400 hover:text-white text-sm"
                  >
                    Back to password login
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="bg-green-800/20 text-green-400 text-sm p-3 rounded-md border border-green-700 mb-4">
                    Check your email for a sign-in link!
                  </div>
                  <button
                    onClick={() => {
                      setShowEmailLogin(false);
                      setLinkSent(false);
                      setEmailForLink("");
                    }}
                    className="text-[#4502fa] hover:underline text-sm"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          )}

          {!showEmailLogin && (
            <>
              {/* OR Divider */}
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-neutral-600"></div>
                <span className="px-2 text-sm text-gray-400">OR</span>
                <div className="flex-grow h-px bg-neutral-600"></div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-80 flex items-center justify-center gap-2 border border-neutral-700 bg-neutral-800 text-white py-3 rounded-lg font-semibold hover:bg-neutral-700 transition duration-200"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Login with Google
              </button>
            </>
          )}

          {/* Register */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Not registered? <Link to="/register" className="text-[#4502fa] hover:underline font-medium">Create an account</Link>
          </div>
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
