// Quill 커스텀 블럿 및 핸들러 유틸리티

// [{src, fit}] 또는 [string] 형태 모두 정규화
function normalizeImages(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) =>
    typeof item === 'string'
      ? { src: item, fit: 'cover' }
      : { src: item.src || '', fit: item.fit || 'cover' }
  );
}

export function registerCustomBlots(Quill) {
  const BlockEmbed = Quill.import('blots/block/embed');

  class ImageRowBlot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      const images = normalizeImages(value);

      images.forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ql-image-row-item';

        const img = document.createElement('img');
        img.setAttribute('src', item.src);
        img.style.objectFit = item.fit;

        // 크롭/전체 토글 버튼 (에디터에서만 CSS로 표시)
        const fitBtn = document.createElement('button');
        fitBtn.className = 'ql-image-fit-btn';
        fitBtn.textContent = item.fit === 'cover' ? '전체' : '크롭';
        fitBtn.setAttribute('data-ql-tooltip', item.fit === 'cover' ? '전체 보기로 전환' : '크롭으로 전환');
        fitBtn.type = 'button';

        wrapper.appendChild(img);
        wrapper.appendChild(fitBtn);
        node.appendChild(wrapper);
      });

      return node;
    }

    // DOM에서 현재 상태 읽어 Delta 값 반환
    static value(node) {
      const images = [];
      node.querySelectorAll('.ql-image-row-item').forEach((wrapper) => {
        const img = wrapper.querySelector('img');
        if (img) {
          images.push({
            src: img.getAttribute('src'),
            fit: img.style.objectFit || 'cover',
          });
        }
      });
      return images;
    }
  }

  ImageRowBlot.blotName = 'image-row';
  ImageRowBlot.tagName = 'div';
  ImageRowBlot.className = 'ql-image-row';

  Quill.register(ImageRowBlot, true);
}

// 이미지 fit 토글 + 라이트박스 핸들러
// editable: true → fit 버튼 활성화, onFitChange → fit 변경 시 Delta 저장 콜백
export function applyImageHandlers(container, { editable = false, onFitChange = null } = {}) {
  container.addEventListener('click', (e) => {
    // fit 토글 버튼
    const fitBtn = e.target.closest('.ql-image-fit-btn');
    if (fitBtn && editable) {
      e.preventDefault();
      e.stopPropagation();

      const wrapper = fitBtn.closest('.ql-image-row-item');
      const img = wrapper?.querySelector('img');
      if (!img) return;

      const newFit = (img.style.objectFit || 'cover') === 'cover' ? 'contain' : 'cover';
      img.style.objectFit = newFit;
      fitBtn.textContent = newFit === 'cover' ? '전체' : '크롭';
      fitBtn.setAttribute('data-ql-tooltip', newFit === 'cover' ? '전체 보기로 전환' : '크롭으로 전환');

      if (onFitChange) onFitChange();
      return;
    }

    // 이미지 클릭 → 라이트박스
    const img = e.target.closest('img');
    if (img && !fitBtn) {
      openLightbox(img.getAttribute('src') || img.src);
    }
  });
}

function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'ql-lightbox';

  const img = document.createElement('img');
  img.src = src;
  overlay.appendChild(img);

  const close = () => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
    document.removeEventListener('keydown', keyHandler);
  };
  const keyHandler = (e) => { if (e.key === 'Escape') close(); };

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', keyHandler);
  document.body.appendChild(overlay);
}

// 툴바 한국어 툴팁
export function applyKoreanTooltips(container) {
  const toolbar = container.previousElementSibling;
  if (!toolbar?.classList.contains('ql-toolbar')) return;

  const set = (selector, label) => {
    const el = toolbar.querySelector(selector);
    if (el) el.setAttribute('data-ql-tooltip', label);
  };

  set('button.ql-bold', '굵게');
  set('button.ql-italic', '기울임');
  set('button.ql-underline', '밑줄');
  set('button.ql-strike', '취소선');
  set('button.ql-blockquote', '인용구');
  set('button.ql-link', '링크');
  set('button.ql-image', '이미지');
  set('button.ql-image-row', '이미지 리스트');
  set('button.ql-clean', '서식 초기화');
  set('button.ql-list[value="ordered"]', '번호 목록');
  set('button.ql-list[value="bullet"]', '글머리 목록');
  set('button.ql-indent[value="-1"]', '내어쓰기');
  set('button.ql-indent[value="+1"]', '들여쓰기');
  set('button.ql-script[value="sub"]', '아래 첨자');
  set('button.ql-script[value="super"]', '위 첨자');
  set('.ql-header .ql-picker-label', '글자 크기');
  set('.ql-align .ql-picker-label', '정렬');
}

// Delta: {"insert": {"image-row": [{"src": "base64...", "fit": "cover"}, ...]}}
export const IMAGE_ROW_ICON = `
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="5" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <rect x="7" y="3" width="5" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <rect x="13" y="3" width="4" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
  </svg>
`;
