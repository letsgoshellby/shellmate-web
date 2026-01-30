import { apiClient } from './client';

/**
 * Agora 화상 상담 API
 */
export class AgoraAPI {
  /**
   * 화상 상담방 정보 조회 및 Agora 토큰 발급
   * GET /consultation/sessions/{sessionId}/video-room/
   * @param {number} sessionId - 상담 세션 ID
   * @returns {Object} { channel_name, user_token, app_id, user_uid }
   */
  static async getVideoRoom(sessionId) {
    const response = await apiClient.get(`/consultation/sessions/${sessionId}/video-room/`);
    return response.data;
  }

  /**
   * 화상 상담방 입장 기록
   * POST /consultation/sessions/{sessionId}/video-room/join/
   * @param {number} sessionId - 상담 세션 ID
   * @returns {Object} 입장 기록 정보
   */
  static async joinVideoRoom(sessionId) {
    const response = await apiClient.post(`/consultation/sessions/${sessionId}/video-room/join/`);
    return response.data;
  }

  /**
   * 화상 상담방 퇴장 기록
   * POST /consultation/sessions/{sessionId}/video-room/leave/
   * @param {number} sessionId - 상담 세션 ID
   * @returns {Object} 퇴장 기록 정보
   */
  static async leaveVideoRoom(sessionId) {
    const response = await apiClient.post(`/consultation/sessions/${sessionId}/video-room/leave/`);
    return response.data;
  }

  /**
   * Agora 토큰 갱신
   * POST /consultation/sessions/{sessionId}/video-room/refresh-token/
   * @param {number} sessionId - 상담 세션 ID
   * @returns {Object} { user_token }
   */
  static async refreshToken(sessionId) {
    const response = await apiClient.post(`/consultation/sessions/${sessionId}/video-room/refresh-token/`);
    return response.data;
  }
}
