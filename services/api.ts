import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Backend API base URL - adjust this to your backend server
const SERVER_BASE_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const SERVER_BASE_URL = 'http://localhost:5000'; // For iOS simulator
// const SERVER_BASE_URL = 'https://your-production-url.com'; // For production

const API_BASE_URL = `${SERVER_BASE_URL}/api`;

// Export for use in other files (e.g., for static file URLs)
export { SERVER_BASE_URL };

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      // You might want to emit an event here to trigger navigation to login
    }
    return Promise.reject(error);
  }
);

// API Service
export const apiService = {
  // Authentication
  login: async (mobileNumber: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { mobileNumber, password });
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل تسجيل الدخول');
    }
  },

  register: async (userData: { name: string; email: string; password: string; phone: string }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل التسجيل');
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل تسجيل الخروج');
    }
  },

  // User Profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error: any) {
      console.error('Profile fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب بيانات الملف الشخصي');
    }
  },

  updateProfile: async (profileData: any) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل تحديث الملف الشخصي');
    }
  },

  // Switch active hierarchy
  switchHierarchy: async (activeHierarchy: 'ORIGINAL' | 'EXPATRIATE' | 'SECTOR') => {
    try {
      const response = await api.put('/users/active-hierarchy', { activeHierarchy });
      return response.data;
    } catch (error: any) {
      console.error('Switch hierarchy error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل تبديل التسلسل الهرمي');
    }
  },

  // Get user's hierarchy memberships
  getUserHierarchyMemberships: async () => {
    try {
      const response = await api.get('/users/hierarchy-memberships');
      return response.data;
    } catch (error: any) {
      console.error('Hierarchy memberships fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب عضويات التسلسل الهرمي');
    }
  },

  // Bulletins
  getBulletins: async (params?: { page?: number; limit?: number }) => {
    try {
      const response = await api.get('/content/bulletins', { params });
      return response.data;
    } catch (error: any) {
      console.error('Bulletins fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب النشرات');
    }
  },

  getBulletinById: async (id: string) => {
    try {
      const response = await api.get(`/content/bulletins/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Bulletin fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب النشرة');
    }
  },

  // Surveys
  getSurveys: async (params?: { type?: string; page?: number; limit?: number }) => {
    try {
      const response = await api.get('/content/surveys', { params });
      return response.data;
    } catch (error: any) {
      console.error('Surveys fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الاستطلاعات');
    }
  },

  getSurveyById: async (id: string) => {
    try {
      const response = await api.get(`/content/surveys/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Survey fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الاستطلاع');
    }
  },

  submitSurveyResponse: async (surveyId: string, responses: any) => {
    try {
      const response = await api.post(`/content/surveys/${surveyId}/respond`, { responses });
      return response.data;
    } catch (error: any) {
      console.error('Survey submission error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل إرسال الإجابات');
    }
  },

  // Voting
  getVotingItems: async (params?: { type?: string; page?: number; limit?: number }) => {
    try {
      const response = await api.get('/content/voting', { params });
      return response.data;
    } catch (error: any) {
      console.error('Voting items fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب التصويتات');
    }
  },

  submitVote: async (votingItemId: string, optionId: string) => {
    try {
      const response = await api.post(`/content/voting/${votingItemId}/vote`, { optionId });
      return response.data;
    } catch (error: any) {
      console.error('Vote submission error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل إرسال التصويت');
    }
  },

  // Reports - see submitReport and getMyReports in the "Reports (Improved)" section below

  // Subscriptions
  getSubscriptionPlans: async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Subscription plans fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب خطط الاشتراك');
    }
  },

  getUserSubscriptions: async () => {
    try {
      const response = await api.get('/content/subscriptions/active');
      return response.data;
    } catch (error: any) {
      console.error('User subscriptions fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الاشتراكات');
    }
  },

  getPreviousSubscriptions: async () => {
    try {
      const response = await api.get('/content/subscriptions/previous');
      return response.data;
    } catch (error: any) {
      console.error('Previous subscriptions fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الاشتراكات السابقة');
    }
  },

  createSubscription: async (planId: string) => {
    try {
      const response = await api.post('/subscriptions/subscribe', { planId });
      return response.data;
    } catch (error: any) {
      console.error('Subscription creation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل إنشاء الاشتراك');
    }
  },

  uploadPaymentReceipt: async (subscriptionId: string, imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('receipt', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      const response = await api.post(`/subscriptions/${subscriptionId}/receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Receipt upload error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل رفع الإيصال');
    }
  },

  // Hierarchy - National Levels
  getNationalLevels: async () => {
    try {
      const response = await api.get('/hierarchy/national-levels');
      return response.data;
    } catch (error: any) {
      console.error('National levels fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب المستويات الوطنية');
    }
  },

  // Hierarchy - Regions
  getRegions: async (nationalLevelId?: string) => {
    try {
      const params = nationalLevelId ? { nationalLevelId } : {};
      const response = await api.get('/hierarchy/regions', { params });
      return response.data;
    } catch (error: any) {
      console.error('Regions fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الولايات');
    }
  },

  // Hierarchy - Localities
  getLocalities: async (regionId?: string) => {
    try {
      const params = regionId ? { regionId } : {};
      const response = await api.get('/hierarchy/localities', { params });
      return response.data;
    } catch (error: any) {
      console.error('Localities fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب المحليات');
    }
  },

  // Hierarchy - Admin Units
  getAdminUnits: async (localityId?: string) => {
    try {
      const params = localityId ? { localityId } : {};
      const response = await api.get('/hierarchy/admin-units', { params });
      return response.data;
    } catch (error: any) {
      console.error('Admin units fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الوحدات الإدارية');
    }
  },

  // Hierarchy - Districts
  getDistricts: async (adminUnitId?: string) => {
    try {
      const params = adminUnitId ? { adminUnitId } : {};
      const response = await api.get('/hierarchy/districts', { params });
      return response.data;
    } catch (error: any) {
      console.error('Districts fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الأحياء');
    }
  },

  // ==================== Chat API ====================
  
  // Get user's chat rooms
  getUserChatRooms: async () => {
    try {
      const response = await api.get('/chat/chatrooms');
      return response.data;
    } catch (error: any) {
      console.error('Chat rooms fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب غرف المحادثة');
    }
  },

  // Get messages for a chat room
  getChatMessages: async (roomId: string, cursor?: string, limit: number = 50) => {
    try {
      const params: { cursor?: string; limit: number } = { limit };
      if (cursor) params.cursor = cursor;
      const response = await api.get(`/chat/chatrooms/${roomId}/messages`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Chat messages fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الرسائل');
    }
  },

  // Send a message to a chat room
  sendChatMessage: async (roomId: string, text: string) => {
    try {
      const response = await api.post(`/chat/chatrooms/${roomId}/messages`, { text });
      return response.data;
    } catch (error: any) {
      console.error('Send message error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل إرسال الرسالة');
    }
  },

  // ==================== Hierarchy-aware Content ====================
  
  // Get public surveys (hierarchy-filtered)
  getPublicSurveys: async () => {
    try {
      const response = await api.get('/content/surveys/public/hierarchical');
      return response.data;
    } catch (error: any) {
      console.error('Public surveys fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الاستبيانات العامة');
    }
  },

  // Get member surveys (hierarchy-filtered)
  getMemberSurveys: async () => {
    try {
      const response = await api.get('/content/surveys/member/hierarchical');
      return response.data;
    } catch (error: any) {
      console.error('Member surveys fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب استبيانات الأعضاء');
    }
  },

  // Get voting items (hierarchy-filtered)
  getVotingItemsHierarchical: async () => {
    try {
      const response = await api.get('/content/voting/hierarchical');
      return response.data;
    } catch (error: any) {
      console.error('Voting items fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب عناصر التصويت');
    }
  },

  // ==================== Archive Documents ====================
  
  // Get archive documents
  getArchiveDocuments: async (category?: string) => {
    try {
      const params = category ? { category } : {};
      const response = await api.get('/content/archive', { params });
      return response.data;
    } catch (error: any) {
      console.error('Archive documents fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الوثائق المؤرشفة');
    }
  },

  // ==================== Reports (Improved) ====================
  
  // Submit report with hierarchy targeting (fixed version)
  submitReport: async (reportData: any, attachments?: any[]) => {
    try {
      const formData = new FormData();
      
      // Add report fields
      formData.append('title', reportData.title);
      formData.append('type', reportData.type);
      formData.append('description', reportData.description);
      formData.append('date', reportData.date || new Date().toISOString());
      
      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        attachments.forEach((file, index) => {
          formData.append('attachments', {
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
            name: file.name || `attachment_${index}`,
          } as any);
        });
      }
      
      const response = await api.post('/content/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Report submission error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل إرسال التقرير');
    }
  },

  // Get user's own reports
  getMyReports: async () => {
    try {
      const response = await api.get('/content/reports/user');
      return response.data;
    } catch (error: any) {
      console.error('My reports fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب تقاريري');
    }
  },

  // ==================== Notifications ====================
  
  // Get user notifications
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error: any) {
      // If notifications endpoint doesn't exist, return empty structure
      if (error.response?.status === 404) {
        return { notifications: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, unreadCount: 0 };
      }
      console.error('Notifications fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل جلب الإشعارات');
    }
  },

  // Get unread notification count
  getUnreadNotificationCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.unreadCount;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return 0;
      }
      console.error('Unread count fetch error:', error.response?.data || error.message);
      return 0;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Mark as read error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل تحديث الإشعار');
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    } catch (error: any) {
      console.error('Mark all as read error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل تحديث الإشعارات');
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete notification error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'فشل حذف الإشعار');
    }
  },
};

export default api;
