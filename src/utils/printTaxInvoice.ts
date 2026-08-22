/** Print the on-page TaxInvoice (same layout as renew preview). */
export function printTaxInvoice(invoiceNo: string): void {
  const invoice = document.getElementById("invoice-print");
  if (!invoice) {
    window.print();
    return;
  }

  const win = window.open("", "_blank", "noreferrer,width=920,height=1200");
  if (!win) {
    window.print();
    return;
  }
  win.opener = null;

  const clone = invoice.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("img").forEach((img) => {
    const abs = new URL(img.getAttribute("src") || "", window.location.href).href;
    img.setAttribute("src", abs);
  });
  clone.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("/")) {
      a.setAttribute("href", new URL(href, window.location.origin).href);
    }
  });

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => {
      if (el instanceof HTMLLinkElement) {
        const href = new URL(el.href, window.location.href).href;
        return `<link rel="stylesheet" href="${href}" />`;
      }
      return el.outerHTML;
    })
    .join("\n");

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <base href="${window.location.origin}/" />
  <title>Invoice ${invoiceNo}</title>
  ${styles}
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #202124 !important;
    }
    body { min-height: 0 !important; }
    .no-print { display: none !important; }
    .gi-invoice {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      max-width: none !important;
    }
    .gi-preview-banner { display: none !important; }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`);
  win.document.close();

  const runPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    }
  };

  void Promise.all(
    Array.from(win.document.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  ).then(() => setTimeout(runPrint, 150));
}
