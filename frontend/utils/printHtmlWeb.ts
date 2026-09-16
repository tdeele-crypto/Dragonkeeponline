/**
 * Web-only helper: print a raw HTML string (e.g. the weekplan) WITHOUT
 * printing the surrounding app page.
 *
 * expo-print's web implementation just calls window.print() and ignores the
 * `html` argument, so on the web it would print the current screen.
 *
 * We open the HTML in a brand-new browser tab and print from there. A new
 * top-level window prints only its own content, which works even when the app
 * itself is running inside an embedded preview iframe (where printing a nested
 * iframe would otherwise print the outer page). If the popup is blocked we fall
 * back to a hidden iframe (works when the app is the top-level page).
 */
export function printHtmlWeb(html: string): void {
  const win = window.open('', '_blank');

  if (win && win.document) {
    // Auto-print once loaded, then close the tab after printing.
    const withAutoPrint = html.replace(
      '</body>',
      `<script>
        window.addEventListener('load', function () {
          setTimeout(function () {
            window.focus();
            window.print();
          }, 400);
        });
        window.addEventListener('afterprint', function () { window.close(); });
      </script></body>`
    );
    win.document.open();
    win.document.write(withAutoPrint);
    win.document.close();
    return;
  }

  // Fallback: hidden iframe (top-level pages only).
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  };

  iframe.onload = () => setTimeout(triggerPrint, 300);
  setTimeout(triggerPrint, 1200);
}
