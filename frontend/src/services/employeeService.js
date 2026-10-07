import api from "./api";

export const employeeService = {
  getEmployees: async (params = {}) => {
    const res = await api.get("/employees", { params });
    return res.data;
  },
  getEmployeeById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  createEmployee: async (data) => {
    const res = await api.post("/employees", data);
    return res.data;
  },
  updateEmployee: async (id, data) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  updatePermissions: async (id, permissions) => {
    const res = await api.put(`/employees/${id}/permissions`, { permissions });
    return res.data;
  },
  deleteEmployee: async (id) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  }
};
