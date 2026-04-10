import apiClient from '../api';

export const submitFoundReport = async (reportData) => {
  try {
    const response = await apiClient.post('/found-reports', reportData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, message: response.message, report: response.report };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to submit report',
    };
  }
};

export const getMyFoundReports = async () => {
  try {
    const response = await apiClient.get('/found-reports/my');
    return { success: true, reports: response.reports || [] };
  } catch (error) {
    return { success: false, reports: [] };
  }
};

export const getPendingFoundReports = async () => {
  try {
    const response = await apiClient.get('/admin/found-reports/pending');
    return { success: true, reports: response.reports || [] };
  } catch (error) {
    return { success: false, reports: [] };
  }
};

export const getFoundReportMatches = async (id) => {
  try {
    const response = await apiClient.get(`/admin/found-reports/${id}/matches`);
    return { success: true, matches: response.matches || [], found_report: response.found_report };
  } catch (error) {
    return { success: false, matches: [] };
  }
};

export const approveFoundReport = async (id) => {
  try {
    const response = await apiClient.patch(`/admin/found-reports/${id}/approve`);
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed' };
  }
};

export const rejectFoundReport = async (id, reason) => {
  try {
    const response = await apiClient.patch(`/admin/found-reports/${id}/reject`, { reason });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed' };
  }
};

export const rematchFoundReport = async (id) => {
  try {
    const response = await apiClient.post(`/admin/found-reports/${id}/rematch`);
    return { success: true, matches: response.matches || [] };
  } catch (error) {
    return { success: false, matches: [] };
  }
};
