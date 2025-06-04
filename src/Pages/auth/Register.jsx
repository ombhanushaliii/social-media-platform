import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

// Password Strength Helper
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
  const { login } = useAuth(); // ✅ Only using login here

  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passStrength, setPassStrength] = useState({ label: "", color: "" });

  useEffect(() => {
    setPassStrength(passwordStrength(password));
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate delay

      // Dummy login simulation
      const userData = { email, companyName };
      const dummyToken = "fake-jwt-token";

      login(userData, dummyToken); // ✅ update auth context
      navigate("/dashboard"); // ✅ redirect after login
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {/* Left - Register Form */}
      <div className="w-full md:w-1/2 bg-black flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Create Your Account 👋</h2>
          <p className="text-sm text-gray-400 text-center mb-8">Register to get started</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-neutral-900 text-white pl-10 pr-4 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
            </div>

            {/* Company Name */}
            <div className="relative">
              <input
                type="text"
                value={companyName}
                required
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
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
                className="w-full bg-neutral-900 text-white pl-10 pr-12 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength */}
            {password && (
              <p className={`text-sm font-medium ${passStrength.color}`}>
                Password Strength: {passStrength.label}
              </p>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-neutral-900 text-white pl-10 pr-12 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-800/20 text-red-400 text-sm p-3 rounded-md border border-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4502fa] hover:bg-[#3601d4] text-white py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                "Signing up..."
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Register</span> <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-[#4502fa] hover:underline font-medium">
              Login here
            </Link>
          </div>
        </div>
      </div>

      {/* Right - Branding */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 85% 30%, rgba(0, 85, 255, 0.7), rgba(0, 0, 0, 0) 60%), #000`,
          }}
        />
        <div className="relative z-10 text-center px-10">
          <h1 className="text-white text-4xl font-extrabold mb-4">
            Join <br />
            <span className="text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              The Best Social Media Management Platform
            </span>
          </h1>
          <p className="text-gray-300">
            Empowering connections with seamless experiences.
            <br />
            Start your journey with us.
          </p>

          <div className="mt-8">
            <div className="w-40 h-40 mx-auto flex items-center justify-center">
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center animate-pulse"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="text-white text-2xl font-bold">Logo</div>
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
