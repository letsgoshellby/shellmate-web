import { apiClient } from './client';

export class QnAAPI {
  // 질문 목록 조회
  static async getQuestions(params = {}) {
    const response = await apiClient.get('/qna/questions/', { params });
    return response.data;
  }
  
  // 질문 상세 조회
  static async getQuestion(id) {
    const response = await apiClient.get(`/qna/questions/${id}/`);
    return response.data;
  }
  
  // 질문 작성
  static async createQuestion(data) {
    const response = await apiClient.post('/qna/questions/', data);
    return response.data;
  }
  
  // 질문 수정
  static async updateQuestion(id, data) {
    const response = await apiClient.patch(`/qna/questions/${id}/`, data);
    return response.data;
  }
  
  // 질문 삭제
  static async deleteQuestion(id) {
    await apiClient.delete(`/qna/questions/${id}/`);
  }
  
  // 답변 작성
  static async createAnswer(questionId, data) {
    const response = await apiClient.post(`/qna/questions/${questionId}/answers/`, data);
    return response.data;
  }
  
  // 답변 수정
  static async updateAnswer(questionId, answerId, data) {
    const response = await apiClient.patch(`/qna/questions/${questionId}/answers/${answerId}/`, data);
    return response.data;
  }
  
  // 답변 삭제
  static async deleteAnswer(questionId, answerId) {
    await apiClient.delete(`/qna/questions/${questionId}/answers/${answerId}/`);
  }
  
  // 답변 채택
  static async acceptAnswer(questionId, answerId) {
    const response = await apiClient.post(`/qna/questions/${questionId}/answers/${answerId}/accept/`);
    return response.data;
  }
  
  // 질문 좋아요
  static async likeQuestion(id) {
    const response = await apiClient.post(`/qna/questions/${id}/like/`);
    return response.data;
  }
  
  // 답변 좋아요
  static async likeAnswer(questionId, answerId) {
    const response = await apiClient.post(`/qna/questions/${questionId}/answers/${answerId}/like/`);
    return response.data;
  }
  
  // 카테고리 목록 조회
  static async getCategories() {
    const response = await apiClient.get('/qna/categories/');
    return response.data;
  }
}