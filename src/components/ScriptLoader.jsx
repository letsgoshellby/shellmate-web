'use client';

import Script from 'next/script';

export function ScriptLoader() {
  return (
    <>
      {/* PortOne V2 결제 SDK */}
      <Script
        src="https://cdn.portone.io/v2/browser-sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          // console.log('PortOne SDK loaded');
        }}
      />

      {/* Kakao JavaScript SDK */}
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // console.log('Kakao SDK loaded successfully', !!window.Kakao);
        }}
        onError={(e) => {
          // console.error('Kakao SDK failed to load', e);
        }}
      />
    </>
  );
}
