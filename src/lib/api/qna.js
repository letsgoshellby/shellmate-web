import { apiClient } from './client';

/**
 * Q&A API - 학부모(Client)용 질문 관련 API
 * 질문 작성/수정/삭제는 본인만 가능
 */
export class QnAClientAPI {
  /**
   * 질문 목록 조회
   * GET /qna/client/questions/
   * @param {Object} params - 쿼리 파라미터 (category, ordering, page, search 등)
   */
  static async getQuestions(params = {}) {
    const response = await apiClient.get('/qna/client/questions/', { params });
    return response.data;
  }

  /**
   * 질문 상세 조회
   * GET /qna/client/questions/{id}/
   * @param {number} questionId - 질문 ID
   */
  static async getQuestion(questionId) {
    const response = await apiClient.get(`/qna/client/questions/${questionId}/`);
    return response.data;
  }

  /**
   * 질문 작성 (학부모 본인만 가능)
   * POST /qna/client/questions/create/
   * @param {Object} data - { title, content, category, is_anonymous }
   */
  static async createQuestion(data) {
    const response = await apiClient.post('/qna/client/questions/create/', data);
    return response.data;
  }

  /**
   * 질문 수정 (학부모 본인만 가능)
   * PATCH /qna/client/questions/{id}/edit/
   * @param {number} questionId - 질문 ID
   * @param {Object} data - { title, content, category, is_anonymous }
   */
  static async updateQuestion(questionId, data) {
    const response = await apiClient.patch(`/qna/client/questions/${questionId}/edit/`, data);
    return response.data;
  }

  /**
   * 질문 삭제 (학부모 본인만 가능)
   * DELETE /qna/client/questions/{id}/delete/
   * @param {number} questionId - 질문 ID
   */
  static async deleteQuestion(questionId) {
    await apiClient.delete(`/qna/client/questions/${questionId}/delete/`);
  }

  /**
   * 질문 공감 토글 (다른 학부모도 가능)
   * POST /qna/client/questions/{id}/sympathy/
   * @param {number} questionId - 질문 ID
   * @returns {Object} { sympathized: boolean, sympathy_count: number }
   */
  static async toggleSympathy(questionId) {
    const response = await apiClient.post(`/qna/client/questions/${questionId}/sympathy/`);
    return response.data;
  }
}

/**
 * Q&A API - 전문가(Expert)용 답변 관련 API
 * 답변 작성/수정/삭제는 전문가 본인만 가능
 */
export class QnAExpertAPI {
  /**
   * 답변 작성 (전문가 본인만 가능)
   * POST /qna/expert/questions/{question_id}/answers/
   * @param {number} questionId - 질문 ID
   * @param {Object} data - { content }
   */
  static async createAnswer(questionId, data) {
    const response = await apiClient.post(`/qna/expert/questions/${questionId}/answers/`, data);
    return response.data;
  }

  /**
   * 답변 수정 (전문가 본인만 가능)
   * PATCH /qna/expert/answers/{id}/edit/
   * @param {number} answerId - 답변 ID
   * @param {Object} data - { content }
   */
  static async updateAnswer(answerId, data) {
    const response = await apiClient.patch(`/qna/expert/answers/${answerId}/edit/`, data);
    return response.data;
  }

  /**
   * 답변 삭제 (전문가 본인만 가능)
   * DELETE /qna/expert/answers/{id}/delete/
   * @param {number} answerId - 답변 ID
   */
  static async deleteAnswer(answerId) {
    await apiClient.delete(`/qna/expert/answers/${answerId}/delete/`);
  }
}

// 하위 호환성을 위한 통합 클래스 (deprecated)
export class QnAAPI {
  // Client APIs
  static getQuestions = QnAClientAPI.getQuestions;
  static getQuestion = QnAClientAPI.getQuestion;
  static createQuestion = QnAClientAPI.createQuestion;
  static updateQuestion = QnAClientAPI.updateQuestion;
  static deleteQuestion = QnAClientAPI.deleteQuestion;
  static toggleSympathy = QnAClientAPI.toggleSympathy;

  // Expert APIs
  static createAnswer = QnAExpertAPI.createAnswer;
  static updateAnswer = QnAExpertAPI.updateAnswer;
  static deleteAnswer = QnAExpertAPI.deleteAnswer;
}
