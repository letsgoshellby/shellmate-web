import { apiClient } from './client';

/**
 * 커리큘럼 API
 */
export class CurriculumAPI {
  /**
   * 커리큘럼 생성
   * POST /consultation/curriculums/create/
   * @param {Object} data - 커리큘럼 데이터
   * @param {number} data.counseling_request_id - 상담 신청 ID
   * @param {string} data.title - 커리큘럼 제목
   * @param {string} data.description - 커리큘럼 설명
   * @param {number} data.total_sessions - 총 세션 수
   * @param {Array} data.sessions_info - 세션별 정보
   * @returns {Object} 생성된 커리큘럼 정보
   */
  static async createCurriculum(data) {
    const response = await apiClient.post('/consultation/curriculums/create/', data);
    return response.data;
  }

  /**
   * 커리큘럼 목록 조회
   * GET /consultation/curriculums/
   * @param {Object} params - 조회 파라미터
   * @returns {Array} 커리큘럼 목록
   */
  static async getCurriculums(params = {}) {
    const response = await apiClient.get('/consultation/curriculums/', { params });
    return response.data;
  }

  /**
   * 커리큘럼 상세 조회
   * GET /consultation/curriculums/{id}/
   * @param {number} id - 커리큘럼 ID
   * @returns {Object} 커리큘럼 상세 정보
   */
  static async getCurriculum(id) {
    const response = await apiClient.get(`/consultation/curriculums/${id}/`);
    return response.data;
  }

  /**
   * 상담 신청에 대한 커리큘럼 조회
   * GET /consultation/curriculums/by-request/{counseling_request_id}/
   * @param {number} counselingRequestId - 상담 신청 ID
   * @returns {Object} 커리큘럼 정보
   */
  static async getCurriculumByRequest(counselingRequestId) {
    const response = await apiClient.get(`/consultation/curriculums/by-request/${counselingRequestId}/`);
    return response.data;
  }

  /**
   * 커리큘럼 수정
   * PATCH /consultation/curriculums/{id}/
   * @param {number} id - 커리큘럼 ID
   * @param {Object} data - 수정할 데이터
   * @returns {Object} 수정된 커리큘럼 정보
   */
  static async updateCurriculum(id, data) {
    const response = await apiClient.patch(`/consultation/curriculums/${id}/`, data);
    return response.data;
  }

  /**
   * 커리큘럼 삭제
   * DELETE /consultation/curriculums/{id}/
   * @param {number} id - 커리큘럼 ID
   * @returns {void}
   */
  static async deleteCurriculum(id) {
    const response = await apiClient.delete(`/consultation/curriculums/${id}/`);
    return response.data;
  }
}
