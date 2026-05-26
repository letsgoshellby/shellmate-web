'use client';

import { useEffect, useRef } from 'react';
import { registerCustomBlots, applyKoreanTooltips, applyImageHandlers, IMAGE_ROW_ICON } from './quillSetup';
import { ColumnsAPI } from '@/lib/api/columns';

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image', 'image-row'],
  ['clean'],
];

// value: Delta JSON string | null
// onChange: (deltaJsonString) => void
export default function QuillEditor({ value, onChange, placeholder, className = '' }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([import('quill'), import('quill-resize-image')]).then(
      ([{ default: Quill }, { default: ImageResize }]) => {
        if (cancelled || !containerRef.current || quillRef.current) return;

        registerCustomBlots(Quill);
        Quill.register('modules/imageResize', ImageResize);

        // 이미지 행 툴바 아이콘 등록
        const icons = Quill.import('ui/icons');
        icons['image-row'] = IMAGE_ROW_ICON;

        // 이미지 핸들러 (quill 할당 전 선언 — 클릭 시점엔 quill이 이미 할당됨)
        let quill = null;

        const imageHandler = () => {
          if (!quill) return;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
              const data = await ColumnsAPI.uploadColumnImage(file);
              const url = data.url || data.image_url || data.image;
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', url, 'user');
              quill.setSelection(range.index + 1, 'silent');
            } catch {
              // 업로드 실패 시 무시
            }
          };
          input.click();
        };

        const imageRowHandler = () => {
          if (!quill) return;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;
          input.onchange = async () => {
            const files = Array.from(input.files || []);
            if (!files.length) return;
            try {
              const results = await Promise.all(files.map((file) => ColumnsAPI.uploadColumnImage(file)));
              const images = results.map((data) => ({
                src: data.url || data.image_url || data.image,
                fit: 'cover',
              }));
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image-row', images, 'user');
              quill.setSelection(range.index + 1, 'silent');
            } catch {
              // 업로드 실패 시 무시
            }
          };
          input.click();
        };

        quill = new Quill(containerRef.current, {
          theme: 'snow',
          placeholder,
          modules: {
            toolbar: {
              container: TOOLBAR,
              handlers: { image: imageHandler, 'image-row': imageRowHandler },
            },
            imageResize: {},
          },
        });

        if (value) {
          try {
            quill.setContents(JSON.parse(value), 'silent');
          } catch {
            quill.setText(value, 'silent');
          }
        }

        quill.on('text-change', (_delta, _old, source) => {
          if (source === 'user') {
            onChangeRef.current(JSON.stringify(quill.getContents()));
          }
        });

        applyKoreanTooltips(containerRef.current);
        applyImageHandlers(containerRef.current, {
          editable: true,
          onFitChange: () => onChangeRef.current(JSON.stringify(quill.getContents())),
        });
        quillRef.current = quill;
      }
    );

    return () => {
      cancelled = true;
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
