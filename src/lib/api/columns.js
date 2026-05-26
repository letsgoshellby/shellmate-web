import { apiClient } from './client';

export class ColumnsAPI {
  // 칼럼 목록 조회
  static async getColumns(params = {}) {
    const response = await apiClient.get('/columns/column/list/', { params });
    return response.data;
  }

  // 내가 작성한 칼럼 목록 (전문가용)
  static async getMyColumns(params = {}) {
    const response = await apiClient.get('/columns/column/list/', { params: { ...params, my_columns: true } });
    return response.data;
  }

  // 칼럼 상세 조회
  static async getColumn(id) {
    const response = await apiClient.get(`/columns/column/${id}/`);
    return response.data;
  }

  // 칼럼 작성 (승인된 전문가만)
  static async createColumn(data) {
    const response = await apiClient.post('/columns/column/create/', data);
    return response.data;
  }

  // 칼럼 수정 (작성자만)
  static async updateColumn(id, data) {
    const response = await apiClient.patch(`/columns/column/${id}/update/`, data);
    return response.data;
  }

  // 칼럼 삭제 (작성자만)
  static async deleteColumn(id) {
    await apiClient.delete(`/columns/column/${id}/delete/`);
  }

  // 칼럼 이미지 업로드
  static async uploadColumnImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/columns/column/images/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // 칼럼 공감 토글
  static async toggleSympathy(id) {
    const response = await apiClient.post(`/columns/column/${id}/sympathy/`);
    return response.data;
  }
}
