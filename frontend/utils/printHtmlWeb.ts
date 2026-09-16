/**
 * Web-only helper: print a raw HTML string (e.g. the weekplan PDF) WITHOUT
 * printing the surrounding app page.
 *
 * expo-print's web implementation just calls window.print() and ignores the
 * `html` argument, so on the web it would print the current Overview screen.
 * We render the HTML into a hidden iframe and print only that iframe instead.
 */
export function printHtmlWeb(html: string): void {
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

  // Print once the iframe (incl. its base64 image) has rendered. onload is the
  // reliable signal; the timeout is a fallback for browsers that don't fire it.
  iframe.onload = () => setTimeout(triggerPrint, 300);
  setTimeout(triggerPrint, 1200);
}
