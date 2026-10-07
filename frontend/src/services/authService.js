import api from "./api.js";

export const authService = {
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  async getMe() {
    const res = await api.get("/auth/me");
    return res.data;
  }
};
