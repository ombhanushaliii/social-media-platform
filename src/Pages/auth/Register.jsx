import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../Context/AuthContext";
import { registerUser } from "../../Services/authService";
import { Link } from "react-router-dom";

const passwordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[\W]/.test(password)) score++;

  if (score <= 1) return "Weak";
  if (score === 2 || score === 3) return "Medium";
  if (score === 4) return "Strong";
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [passwordStrengthLevel, setPasswordStrengthLevel] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrengthLevel(passwordStrength(value));
    }
  };

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) return setError("Name is required");
      if (!form.age || Number(form.age) < 13)
        return setError("You must be at least 13 years old");
      if (!form.email.trim()) return setError("Email is required");
    } else if (step === 3) {
      if (form.password !== form.confirmPassword) {
        return setError("Passwords do not match");
      }
      if (passwordStrengthLevel === "Weak") {
        return setError("Please choose a stronger password");
      }
    }
    setError("");
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError("");

    try {
      const { user, token } = await registerUser({
        name: form.name,
        age: form.age,
        email: form.email,
        company: form.company,
        password: form.password,
      });

      login(user, token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black px-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Secure Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  min="13"
                  required
                  value={form.age}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
                  placeholder="18"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
                  placeholder="example@mail.com"
                />
              </div>
            </>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Company Name (optional)
              </label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
                placeholder="My Company LLC"
              />
            </div>
          )}

          {/* Step 3: Passwords */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
                {form.password && (
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      passwordStrengthLevel === "Weak"
                        ? "text-red-600"
                        : passwordStrengthLevel === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    Password strength: {passwordStrengthLevel}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </div>
            </>

            
          )}

          {/* Error message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 rounded-lg border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition"
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Next
              </button>
            )}

            {step === 3 && (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            )}
          </div>

        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already a user?{" "}
            <Link to="/login" className="text-purple-600 hover:underline font-semibold">
              Login
            </Link>
          </p>
        </div>
        
      </motion.div>
    </div>
  );
};

export default Register;
