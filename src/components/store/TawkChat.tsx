'use client';

import Script from 'next/script';

// Live chat widget (Tawk.to) — loaded lazily since it's a background/support
// widget, not something needed for the initial page render.
export function TawkChat() {
  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`
        var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
        (function () {
          var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = 'https://embed.tawk.to/6a86c694b56df5344af1b744/1k0f7fd5m';
          s1.charset = 'UTF-8';
          s1.setAttribute('crossorigin', '*');
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  );
}
