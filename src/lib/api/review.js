import { apiClient } from './client';

/**
 * 상담 리뷰 API
 */
export class ReviewAPI {
  /**
   * 상담 리뷰 작성
   * POST /consultation/reviews/create/
   * @param {Object} data - 리뷰 데이터
   * @param {number} data.counseling_request - 상담 신청 ID
   * @param {string} data.title - 리뷰 제목
   * @param {string} data.content - 리뷰 내용
   * @param {number} data.rating - 별점 (1-5)
   * @returns {Object} 생성된 리뷰
   */
  static async createReview(data) {
    const response = await apiClient.post('/consultation/reviews/create/', data);
    return response.data;
  }

  /**
   * 상담 리뷰 목록 조회
   * GET /consultation/reviews/
   * @param {Object} params - 필터 파라미터
   * @param {number} params.counseling_request_id - 상담 신청 ID 필터
   * @param {number} params.expert_id - 전문가 ID 필터
   * @param {number} params.rating - 별점 필터 (1-5)
   * @returns {Array} 리뷰 목록
   */
  static async getReviews(params = {}) {
    const response = await apiClient.get('/consultation/reviews/', { params });
    return response.data;
  }

  /**
   * 상담 리뷰 상세 조회
   * GET /consultation/reviews/{review_id}/
   * @param {number} reviewId - 리뷰 ID
   * @returns {Object} 리뷰 상세
   */
  static async getReview(reviewId) {
    const response = await apiClient.get(`/consultation/reviews/${reviewId}/`);
    return response.data;
  }
}
