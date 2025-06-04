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

export const registerUser = async ({ name, age, email, company, password }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (existingUsers.includes(email)) {
        reject(new Error("Email already registered"));
      } else {
        const newUser = {
          id: `user_${Date.now()}`,
          name,
          age,
          email,
          company,
        };
        const dummyToken = "dummy-jwt-token";
        existingUsers.push(email);
        resolve({ user: newUser, token: dummyToken });
      }
    }, 1000);
  });
};
