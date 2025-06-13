// authService.js

const existingUsers = ["manager@test.com"]; // simulate registered users

export const loginUser = async (email, password) => {
  if (email === "manager@test.com" && password === "secure123") {
    const dummyUser = {
      id: "manager001",
      name: "Test Manager",
      email,
    };
    const dummyToken = "dummy-jwt-token";
    return { user: dummyUser, token: dummyToken };
  }
  throw new Error("Invalid email or password");
};

