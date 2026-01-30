import { apiClient } from './client';

/**
 * Chat API - 채팅 관련 API
 */
export class ChatAPI {
  /**
   * 채팅방 목록 조회
   * GET /chat/
   * @returns {Array} 채팅방 목록
   */
  static async getChatRooms() {
    const response = await apiClient.get('/chat/');
    return response.data;
  }

  /**
   * 채팅방 상세 조회
   * GET /chat/{chat_room_id}/
   * @param {number} chatRoomId - 채팅방 ID
   * @returns {Object} 채팅방 상세 정보
   */
  static async getChatRoom(chatRoomId) {
    const response = await apiClient.get(`/chat/${chatRoomId}/`);
    return response.data;
  }

  /**
   * 채팅 메시지 목록 조회
   * GET /chat/{chat_room_id}/messages/
   * @param {number} chatRoomId - 채팅방 ID
   * @param {Object} params - 쿼리 파라미터 (before, page, page_size)
   * @returns {Array} 메시지 목록
   */
  static async getMessages(chatRoomId, params = {}) {
    const response = await apiClient.get(`/chat/${chatRoomId}/messages/`, { params });
    return response.data;
  }

  /**
   * 채팅 메시지 전송
   * POST /chat/{chat_room_id}/messages/send/
   * @param {number} chatRoomId - 채팅방 ID
   * @param {Object} data - 메시지 데이터
   * @param {string} data.message_type - 메시지 타입 (GENERAL, IMAGE, SCHEDULE_CHANGE)
   * @param {string} data.content - 메시지 내용
   * @param {File} data.image - 이미지 파일 (IMAGE 타입일 때)
   * @param {number} data.related_session_id - 관련 세션 ID (선택)
   * @returns {Object} 전송된 메시지
   */
  static async sendMessage(chatRoomId, data) {
    const formData = new FormData();

    if (data.message_type) {
      formData.append('message_type', data.message_type);
    }
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.image) {
      formData.append('image', data.image);
    }
    if (data.related_session_id) {
      formData.append('related_session_id', data.related_session_id);
    }

    const response = await apiClient.post(`/chat/${chatRoomId}/messages/send/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 메시지 읽음 처리
   * PATCH /chat/{chat_room_id}/messages/{message_id}/read/
   * @param {number} chatRoomId - 채팅방 ID
   * @param {number} messageId - 메시지 ID
   * @returns {Object} 읽음 처리된 메시지
   */
  static async markAsRead(chatRoomId, messageId) {
    const response = await apiClient.patch(`/chat/${chatRoomId}/messages/${messageId}/read/`);
    return response.data;
  }

  /**
   * 모든 메시지 읽음 처리
   * POST /chat/{chat_room_id}/messages/read-all/
   * @param {number} chatRoomId - 채팅방 ID
   * @returns {Object} { message: string, marked_count: number }
   */
  static async markAllAsRead(chatRoomId) {
    const response = await apiClient.post(`/chat/${chatRoomId}/messages/read-all/`);
    return response.data;
  }

  /**
   * 메시지 삭제 (Soft Delete)
   * DELETE /chat/{chat_room_id}/messages/{message_id}/delete/
   * @param {number} chatRoomId - 채팅방 ID
   * @param {number} messageId - 메시지 ID
   * @returns {Object} { message: string }
   */
  static async deleteMessage(chatRoomId, messageId) {
    const response = await apiClient.delete(`/chat/${chatRoomId}/messages/${messageId}/delete/`);
    return response.data;
  }
}
