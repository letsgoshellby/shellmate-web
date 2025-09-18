import { apiClient } from './client';

export const consultationAPI = {
  // 상담 예약
  async bookConsultation(data) {
    const response = await apiClient.post('/consultations/', data);
    return response.data;
  },

  // 상담 목록 조회 (내담자용)
  async getConsultations(params = {}) {
    const response = await apiClient.get('/consultations/', { params });
    return response.data;
  },

  // 상담 상세 조회
  async getConsultationDetail(id) {
    const response = await apiClient.get(`/consultations/${id}/`);
    return response.data;
  },

  // 상담 취소
  async cancelConsultation(id) {
    const response = await apiClient.patch(`/consultations/${id}/cancel/`);
    return response.data;
  },

  // 상담 상태 업데이트 (전문가용)
  async updateConsultationStatus(id, status) {
    const response = await apiClient.patch(`/consultations/${id}/status/`, {
      status
    });
    return response.data;
  },

  // 리뷰 작성
  async createReview(consultationId, reviewData) {
    const response = await apiClient.post(`/consultations/${consultationId}/review/`, reviewData);
    return response.data;
  },

  // 리뷰 조회
  async getReview(consultationId) {
    const response = await apiClient.get(`/consultations/${consultationId}/review/`);
    return response.data;
  },

  // 전문가 목록 조회 (예약용)
  async getExperts(params = {}) {
    const response = await apiClient.get('/experts/', { params });
    return response.data;
  },

  // 전문가 상세 조회
  async getExpertDetail(id) {
    const response = await apiClient.get(`/experts/${id}/`);
    return response.data;
  },

  // 전문가 가능한 시간대 조회
  async getExpertAvailability(expertId, date) {
    const response = await apiClient.get(`/experts/${expertId}/availability/`, {
      params: { date }
    });
    return response.data;
  },

  // 전문가 상담 목록 조회 (전문가용)
  async getExpertConsultations(params = {}) {
    const response = await apiClient.get('/expert/consultations/', { params });
    return response.data;
  },

  // 상담 노트 작성/업데이트 (전문가용)
  async updateConsultationNotes(id, notes) {
    const response = await apiClient.patch(`/consultations/${id}/notes/`, {
      notes
    });
    return response.data;
  },

  // 상담 통계 조회 (전문가용)
  async getConsultationStats() {
    const response = await apiClient.get('/expert/consultation-stats/');
    return response.data;
  },
};