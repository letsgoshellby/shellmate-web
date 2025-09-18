import { apiClient } from './client';

export class ConsultationsAPI {
  // 상담 예약 목록 조회
  static async getConsultations(params = {}) {
    const response = await apiClient.get('/consultations/', { params });
    return response.data;
  }
  
  // 상담 상세 조회
  static async getConsultation(id) {
    const response = await apiClient.get(`/consultations/${id}/`);
    return response.data;
  }
  
  // 상담 예약 (내담자용)
  static async createConsultation(data) {
    const response = await apiClient.post('/consultations/', data);
    return response.data;
  }
  
  // 상담 수정
  static async updateConsultation(id, data) {
    const response = await apiClient.patch(`/consultations/${id}/`, data);
    return response.data;
  }
  
  // 상담 취소
  static async cancelConsultation(id, reason) {
    const response = await apiClient.post(`/consultations/${id}/cancel/`, { reason });
    return response.data;
  }
  
  // 상담 승인 (전문가용)
  static async approveConsultation(id) {
    const response = await apiClient.post(`/consultations/${id}/approve/`);
    return response.data;
  }
  
  // 상담 거절 (전문가용)
  static async rejectConsultation(id, reason) {
    const response = await apiClient.post(`/consultations/${id}/reject/`, { reason });
    return response.data;
  }
  
  // 상담 완료 처리
  static async completeConsultation(id, notes) {
    const response = await apiClient.post(`/consultations/${id}/complete/`, { notes });
    return response.data;
  }
  
  // 상담 평가 (내담자용)
  static async rateConsultation(id, rating, feedback) {
    const response = await apiClient.post(`/consultations/${id}/rate/`, { 
      rating, 
      feedback 
    });
    return response.data;
  }
  
  // 전문가 목록 조회
  static async getExperts(params = {}) {
    const response = await apiClient.get('/experts/', { params });
    return response.data;
  }
  
  // 전문가 상세 정보 조회
  static async getExpert(id) {
    const response = await apiClient.get(`/experts/${id}/`);
    return response.data;
  }
  
  // 전문가 가능한 시간 조회
  static async getExpertAvailability(expertId, date) {
    const response = await apiClient.get(`/experts/${expertId}/availability/`, {
      params: { date }
    });
    return response.data;
  }
  
  // 내 상담 목록 (역할에 따라)
  static async getMyConsultations(params = {}) {
    const response = await apiClient.get('/consultations/my/', { params });
    return response.data;
  }
  
  // 상담 통계 (전문가용)
  static async getConsultationStats(params = {}) {
    const response = await apiClient.get('/consultations/stats/', { params });
    return response.data;
  }
  
  // 화상 상담 룸 생성/참여
  static async joinConsultationRoom(consultationId) {
    const response = await apiClient.post(`/consultations/${consultationId}/join/`);
    return response.data;
  }
  
  // 상담 메모 추가 (전문가용)
  static async addConsultationNote(consultationId, note) {
    const response = await apiClient.post(`/consultations/${consultationId}/notes/`, { note });
    return response.data;
  }
}