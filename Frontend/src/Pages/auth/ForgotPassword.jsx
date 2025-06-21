import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/user/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6 py-12" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>

        {!success ? (
          <>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Forgot Password?</h2>
            <p className="text-gray-400 text-center mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-neutral-900 text-white pl-10 pr-4 py-3 rounded-lg border border-neutral-700 focus:ring-2 focus:ring-[#4502fa] placeholder-gray-500 outline-none"
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
                className="w-full bg-[#4502fa] hover:bg-[#3601d4] text-white py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a password reset link to <span className="text-white">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link 
            to="/login" 
            className="flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;