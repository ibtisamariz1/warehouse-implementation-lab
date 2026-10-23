# Test plan and evidence

Baseline: v1.0. Test data: initial 12 units + receipt 48 − order 24 = closing 36. Reset between scenarios. Automated tests use Node's built-in runner. Run `node --test`; record the actual date and output for each release. No customer or warehouse has signed off this lab.

| ID / level | Steps | Expected |
|---|---|---|
| FAT-01 / automated | Receive, putaway, allocate, pick, dispatch, deliver | FIFO 12+12; closing 36; zero reservations; delivered; duplicate delivery rejected |
| FAT-02 / automated | Capacity 20; receive; putaway | CAPACITY_EXCEEDED; no extra stock; receipt stays RECEIVED |
| FAT-03 / automated | Allocate before inbound; pick/dispatch too early | Rejected; order NEW; zero reservations |
| FAT-04 / automated | LIFO allocation; separate chilled-zone scenario | 24 from LOT-002; chilled stock allocated from C-01 |
| FAT-05 / automated | Invalid capacity; save and reload snapshot | Invalid config rejected; restored receipt PUTAWAY |
| FAT-06 / automated | Repeat receipt, putaway and pick | No duplicate stock movements; closing 36 |
| SIT-01 / HTTP smoke | Start server; use UI or API through dispatch and deliver | Real loopback POST to carrier returns 202; message DELIVERED |
| SIT-02 / automated domain + HTTP smoke | Inject fault before dispatch; send; repair; retry | 422 then 202; one message, two attempts; dispatch remains confirmed |

## UAT-01 · Operations walkthrough (manual)

Role: warehouse supervisor. Follow README demonstration steps 1–6. Confirm labels and quantities are understandable, pick locations match allocations, carrier rejection is visible without undoing dispatch, and the repair trail explains the correction. Capture a screenshot of final stock, message and journal. Expected closing stock 36, order DISPATCHED, message DELIVERED, attempts 2.

## UAT-02 · Configuration and recovery (manual)

Role: application engineer with operations reviewer. Reset. Configure capacity 20; receive then attempt putaway. Confirm the rejection. Change capacity to 100 and retry successfully. Confirm the configuration journal entry. Restart the app and verify the receipt remains PUTAWAY. Reset; select LIFO, receive, putaway and allocate. Confirm 24 units are reserved from A-02.

## Acceptance record

Release: ____  Environment: ____  Date: ____

Automated run / evidence file: ____

UAT-01 result and reviewer: ____  UAT-02 result and reviewer: ____

Open issues: ____  Accepted limitations: ____  Go/no-go decision: ____

These are execution templates; blank fields must not be represented as completed sign-offs.

