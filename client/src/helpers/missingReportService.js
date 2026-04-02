import apiClient from '../api';
import toast from 'react-hot-toast';

/**
 * Upload image to backend (which uploads to Cloudinary)
 * @param {File} file 
 * @returns {Promise<{success: boolean, url: string, publicId: string}>}
 */
export const uploadImageToCloudinary = async (file) => {
  try {
    if (!file) {
      return { success: false, message: 'No file provided' };
    }

    const formData = new FormData();
    formData.append('photo', file);

    const response = await apiClient.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.success || response.data?.success) {
      return {
        success: true,
        url: response.url || response.data?.url,
        publicId: response.public_id || response.data?.public_id,
      };
    }

    return {
      success: false,
      message: response.message || 'Upload failed',
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Upload failed',
    };
  }
};

/**
 * Submit missing person report with image
 * @param {Object} reportData 
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const submitMissingReport = async (reportData) => {
  try {
    const response = await apiClient.post('/missing-reports', reportData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      message: response.message || 'Report submitted successfully',
      report: response.report,
    };
  } catch (error) {
    console.error('Submit report error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to submit report',
    };
  }
};

/**
 * Get all published missing reports
 * @returns {Promise<{success: boolean, reports: Array}>}
 */
export const getPublishedReports = async () => {
  try {
    const response = await apiClient.get('/missing-reports/published');

    return {
      success: true,
      reports: response.reports || response,
    };
  } catch (error) {
    console.error('Fetch reports error:', error);
    return {
      success: false,
      reports: [],
      message: error.message || 'Failed to fetch reports',
    };
  }
};

/**
 * Get all pending missing reports for admin moderation
 * @returns {Promise<{success: boolean, reports: Array}>}
 */
export const getPendingMissingReports = async () => {
  try {
    const response = await apiClient.get('/admin/missing-reports/pending');

    return {
      success: true,
      reports: Array.isArray(response) ? response : response.reports || [],
    };
  } catch (error) {
    console.error('Fetch pending reports error:', error);
    return {
      success: false,
      reports: [],
      message: error.message || 'Failed to fetch pending reports',
    };
  }
};

/**
 * Approve a pending missing report
 * @param {number|string} id
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const approveMissingReport = async (id) => {
  try {
    const response = await apiClient.patch(`/admin/missing-reports/${id}/approve`);

    return {
      success: true,
      message: response.message || 'Report approved',
      report: response.report,
    };
  } catch (error) {
    console.error('Approve report error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to approve report',
    };
  }
};

/**
 * Reject a pending missing report
 * @param {number|string} id
 * @param {string} reason
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const rejectMissingReport = async (id, reason) => {
  try {
    const response = await apiClient.patch(`/admin/missing-reports/${id}/reject`, { reason });

    return {
      success: true,
      message: response.message || 'Report rejected',
      report: response.report,
    };
  } catch (error) {
    console.error('Reject report error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to reject report',
    };
  }
};
