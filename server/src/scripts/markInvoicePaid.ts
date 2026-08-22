/**
 * Mark a renewal invoice as paid and trigger Task Manager activation webhook.
 *
 * Usage (on VPS after build:api):
 *   node dist-server/scripts/markInvoicePaid.js KLP-20260820-8341
 */
import { markRenewalPaid } from "../services/renewalService.js";

const invoiceNo = process.argv[2]?.trim();
if (!invoiceNo) {
  console.error("Usage: node dist-server/scripts/markInvoicePaid.js <INVOICE_NO>");
  process.exit(1);
}

markRenewalPaid(invoiceNo)
  .then(({ renewal, activation }) => {
    console.log("Marked paid:", renewal.invoice_no, renewal.company);
    console.log("Status:", renewal.status);
    console.log("Activation:", activation.ok ? "OK" : "NEEDS MANUAL", activation.note);
    process.exit(activation.ok ? 0 : 2);
  })
  .catch((err) => {
    console.error("Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
