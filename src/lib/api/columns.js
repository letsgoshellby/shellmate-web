import { apiClient } from './client';

export class ColumnsAPI {
  // 칼럼 목록 조회
  static async getColumns(params = {}) {
    const response = await apiClient.get('/columns/', { params });
    return response.data;
  }
  
  // 칼럼 상세 조회
  static async getColumn(id) {
    const response = await apiClient.get(`/columns/${id}/`);
    return response.data;
  }
  
  // 칼럼 작성 (전문가만)
  static async createColumn(data) {
    const response = await apiClient.post('/columns/', data);
    return response.data;
  }
  
  // 칼럼 수정 (전문가만)
  static async updateColumn(id, data) {
    const response = await apiClient.patch(`/columns/${id}/`, data);
    return response.data;
  }
  
  // 칼럼 삭제 (전문가만)
  static async deleteColumn(id) {
    await apiClient.delete(`/columns/${id}/`);
  }
  
  // 칼럼 좋아요
  static async likeColumn(id) {
    const response = await apiClient.post(`/columns/${id}/like/`);
    return response.data;
  }
  
  // 칼럼 조회수 증가
  static async incrementViews(id) {
    const response = await apiClient.post(`/columns/${id}/view/`);
    return response.data;
  }
  
  // 내가 작성한 칼럼 목록 (전문가용)
  static async getMyColumns(params = {}) {
    const response = await apiClient.get('/columns/my/', { params });
    return response.data;
  }
  
  // 카테고리별 칼럼 조회
  static async getColumnsByCategory(category, params = {}) {
    const response = await apiClient.get(`/columns/category/${category}/`, { params });
    return response.data;
  }
  
  // 인기 칼럼 조회
  static async getPopularColumns(params = {}) {
    const response = await apiClient.get('/columns/popular/', { params });
    return response.data;
  }
  
  // 최신 칼럼 조회
  static async getRecentColumns(params = {}) {
    const response = await apiClient.get('/columns/recent/', { params });
    return response.data;
  }
}