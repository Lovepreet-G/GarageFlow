import api from "../api"

const payrollApi = {
  getSummary: (params) => api.get("/payroll", { params }),
  saveDraft: (payload) => api.post("/payroll/save", payload),
  finalize: (payload) => api.post("/payroll/finalize", payload),
  downloadPdf: (params) =>
    api.get("/payroll/download-pdf", {
      params,
      responseType: "blob",
    }),
}

export default payrollApi
