const ADMIN_CHAT_TYPES = [
  'RESERVATION_REQUEST',
  'SCHEDULE_CONFIRM',
  'SESSION_REMINDER',
  'SESSION_COMPLETE',
  'SCHEDULE_CHANGE',
  'PAYMENT_NOTICE',
  'COUNSELING_LOG_COMPLETE',
  'CURRICULUM',
  'reservation_request',
  'reservation_accept',
  'reservation_imminent',
  'reservation_complete',
  'counseling_log_complete',
];

// SYSTEM 메시지 중 커리큘럼 작성 요청 안내(전문가 전용 지시 문구)인지 여부
export function isCurriculumRequestMessage(message) {
  return message.message_type === 'SYSTEM' && !!message.content?.includes('커리큘럼');
}

// 상담 예약 관련 메시지 - AdminChat 카드로 표시할 대상
export function isAdminChatMessage(message) {
  if (ADMIN_CHAT_TYPES.includes(message.message_type)) return true;
  if (isCurriculumRequestMessage(message)) return true;
  return false;
}

// 채팅방 개설 등 간단한 시스템 메시지 - 중앙 회색 배경으로 표시할 대상
export function isSimpleSystemMessage(message) {
  return message.message_type === 'SYSTEM' && !isAdminChatMessage(message);
}

export function formatMessageTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMessageDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function isMyMessage(message, user) {
  // sender 객체의 id와 user.id 비교
  if (message.sender?.id && user?.id) {
    return message.sender.id == user.id;
  }
  // 구버전 호환: sender_id와 비교
  if (message.sender_id && user?.id) {
    return message.sender_id == user.id;
  }
  return message.sender === user?.name || message.sender === user?.email;
}

export function shouldShowDateSeparator(currentMsg, prevMsg) {
  if (!prevMsg) return true;
  const currentDate = new Date(currentMsg.sent_at).toDateString();
  const prevDate = new Date(prevMsg.sent_at).toDateString();
  return currentDate !== prevDate;
}
