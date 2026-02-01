import { apiClient } from './client';

export class ExpertsAPI {
  /**
   * 전문가 목록 조회
   */
  static async getExperts(params = {}) {
    const response = await apiClient.get('/experts/', { params });
    return response.data;
  }

  /**
   * 전문가 상세 정보 조회
   */
  static async getExpertDetail(expertId) {
    const response = await apiClient.get(`/experts/${expertId}/`);
    return response.data;
  }
}
