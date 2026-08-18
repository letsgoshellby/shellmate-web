const QNA_CATEGORIES = {
  concentration: '집중력',
  language: '언어발달',
  social: '사회성',
  behavior: '행동',
  learning: '학습',
  emotion: '정서발달',
};

export function formatQnADate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export function getQnACategoryName(category) {
  return QNA_CATEGORIES[category] || category;
}
