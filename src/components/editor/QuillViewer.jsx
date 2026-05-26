'use client';

import { useEffect, useRef } from 'react';
import { registerCustomBlots, applyImageHandlers } from './quillSetup';

// content: Delta JSON string
export default function QuillViewer({ content, className = '' }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import('quill').then(({ default: Quill }) => {
      if (cancelled || !containerRef.current || quillRef.current) return;

      registerCustomBlots(Quill);

      const quill = new Quill(containerRef.current, {
        theme: 'snow',
        readOnly: true,
        modules: { toolbar: false },
      });

      if (content) {
        try {
          quill.setContents(JSON.parse(content), 'silent');
        } catch {
          quill.setText(content, 'silent');
        }
      }

      applyImageHandlers(containerRef.current, { editable: false });
      quillRef.current = quill;
    });

    return () => {
      cancelled = true;
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!quillRef.current || !content) return;
    try {
      quillRef.current.setContents(JSON.parse(content), 'silent');
    } catch {
      quillRef.current.setText(content, 'silent');
    }
  }, [content]);

  return <div ref={containerRef} className={className} />;
}
