import { apiClient } from './client';

/**
 * Expert API - 전문가 관련 API
 */
export class ExpertAPI {
  /**
   * 전문가 목록 조회
   * GET /experts/
   * @param {Object} params - 쿼리 파라미터
   * @param {number} params.page - 페이지 번호
   * @param {number} params.page_size - 페이지 크기 (최대 50)
   * @param {string} params.search - 검색어 (이름, 소속, 소개)
   * @returns {Array} 전문가 목록
   */
  static async getExperts(params = {}) {
    const response = await apiClient.get('/experts/', { params });
    return response.data;
  }

  /**
   * 전문가 상세 정보 조회
   * GET /experts/{expert_id}/
   * @param {number} expertId - 전문가 ID
   * @returns {Object} 전문가 상세 정보
   */
  static async getExpert(expertId) {
    const response = await apiClient.get(`/experts/${expertId}/`);
    return response.data;
  }
}
