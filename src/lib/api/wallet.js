import { apiClient } from './client';

/**
 * Wallet API - 지갑/결제 관련 API
 */
export class WalletAPI {
  /**
   * 내 지갑 정보 조회
   * GET /wallet/me/
   * @returns {Object} 지갑 정보 (잔액, 최근 거래내역, 통계)
   */
  static async getMyWallet() {
    const response = await apiClient.get('/wallet/me/');
    return response.data;
  }

  /**
   * 토큰 패키지 목록 조회
   * GET /wallet/tokens/packages/
   * @returns {Array} 토큰 패키지 목록
   */
  static async getTokenPackages() {
    const response = await apiClient.get('/wallet/tokens/packages/');
    return response.data;
  }

  /**
   * 토큰 구매 준비 (PortOne 결제용 주문 정보 생성)
   * POST /wallet/tokens/purchase/prepare/
   * @param {string} productId - 상품 ID
   * @returns {Object} 결제 준비 정보 (order_id, amount 등)
   */
  static async prepareTokenPurchase(productId) {
    const response = await apiClient.post('/wallet/tokens/purchase/prepare/', {
      product_id: productId,
    });
    return response.data;
  }

  /**
   * 토큰 구매 확인 (PortOne 결제 완료 후 검증 및 토큰 지급)
   * POST /wallet/tokens/purchase/confirm/
   * @param {string} orderId - 주문 ID
   * @param {string} paymentId - 결제 ID (PortOne에서 받은)
   * @returns {Object} 토큰 지급 결과
   */
  static async confirmTokenPurchase(orderId, paymentId) {
    const response = await apiClient.post('/wallet/tokens/purchase/confirm/', {
      order_id: orderId,
      payment_id: paymentId,
    });
    return response.data;
  }

  /**
   * 거래내역 조회
   * GET /wallet/transactions/
   * @param {Object} params - 쿼리 파라미터
   * @param {string} params.date_from - 시작 날짜
   * @param {string} params.date_to - 종료 날짜
   * @param {boolean} params.income_only - 수입만 조회
   * @param {string} params.transaction_type - 거래 유형
   * @param {string} params.status - 상태
   * @param {number} params.page - 페이지 번호
   * @param {number} params.page_size - 페이지 크기
   * @returns {Object} 거래내역 목록
   */
  static async getTransactions(params = {}) {
    const response = await apiClient.get('/wallet/transactions/', { params });
    return response.data;
  }
}
