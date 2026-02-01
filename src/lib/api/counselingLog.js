import { apiClient } from './client';

/**
 * 상담 일지 API
 */
export class CounselingLogAPI {
  /**
   * 상담 일지 목록 조회
   * GET /consultation/counseling-logs/
   * @param {Object} params - 필터 파라미터
   * @param {number} params.session_id - 세션 ID 필터
   * @param {number} params.counseling_request_id - 상담 신청 ID 필터
   * @param {string} params.status - 상태 필터 (DRAFT, PUBLISHED)
   * @returns {Array} 상담 일지 목록
   */
  static async getCounselingLogs(params = {}) {
    const response = await apiClient.get('/consultation/counseling-logs/', { params });
    return response.data;
  }

  /**
   * 상담 일지 상세 조회
   * GET /consultation/counseling-logs/{logId}/
   * @param {number} logId - 일지 ID
   * @returns {Object} 상담 일지 상세
   */
  static async getCounselingLog(logId) {
    const response = await apiClient.get(`/consultation/counseling-logs/${logId}/`);
    return response.data;
  }

  /**
   * 상담 일지 생성
   * POST /consultation/counseling-logs/create/
   * @param {Object} data - 일지 데이터
   * @param {number} data.session_id - 세션 ID
   * @param {string} data.session_goal - 회기 목표
   * @param {string} data.session_content - 회기 내용
   * @param {string} data.counselor_opinion - 전문가 의견
   * @param {string} data.status - 상태 (DRAFT | PUBLISHED)
   * @returns {Object} 생성된 일지
   */
  static async createLog(data) {
    const response = await apiClient.post('/consultation/counseling-logs/create/', data);
    return response.data;
  }

  /**
   * 상담 일지 수정
   * PATCH /consultation/counseling-logs/{logId}/update/
   * @param {number} logId - 일지 ID
   * @param {Object} data - 수정할 데이터
   * @returns {Object} 수정된 일지
   */
  static async updateLog(logId, data) {
    const response = await apiClient.patch(`/consultation/counseling-logs/${logId}/update/`, data);
    return response.data;
  }

  /**
   * 상담 일지 작성 완료 처리
   * POST /consultation/counseling-logs/{logId}/publish/
   * @param {number} logId - 일지 ID
   * @returns {Object} 발행된 일지
   */
  static async publishLog(logId) {
    const response = await apiClient.post(`/consultation/counseling-logs/${logId}/publish/`);
    return response.data;
  }
}
