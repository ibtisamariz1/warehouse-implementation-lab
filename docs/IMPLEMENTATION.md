# Implementation design · WH-01 · baseline 1.0

## Business scenario

A small warehouse receives tea, puts it away in a configured storage zone, fulfils a retail order and sends a shipment notification to a carrier. Operations needs stock integrity and understandable exceptions; IT needs a documented mapping, reproducible diagnosis and controlled configuration changes. This models responsibilities in the supplied DSV Application Engineer JD without claiming access to CargoWrite or Dispatcher.

| Requirement | Solution | Acceptance evidence |
|---|---|---|
| R01 Inbound and putaway | EXPECTED → RECEIVED → PUTAWAY; capacity and configured zone | FAT-01, FAT-02 |
| R02 Inventory and allocation | Lot-level on hand, reserved, available; FIFO/LIFO within selected zone | FAT-03, FAT-04 |
| R03 Picking and dispatch | NEW → ALLOCATED → PICKED → DISPATCHED; pick consumes stock | FAT-01, FAT-06 |
| R04 API integration | Shipment JSON → local carrier HTTP endpoint; status independent of dispatch | SIT-01, SIT-02 |
| R05 Support and RCA | Fault switch, response diagnostics, repair/retry and event trail | SIT-02, RCA.md |
| R06 Configuration control | Validated rule changes, snapshot persistence and change events | FAT-05, CHANGE-DEPLOYMENT.md |
| R07 Operations acceptance | Guided scripts and explicit sign-off fields | TEST-PLAN.md |

## Architecture and data

Browser → Node HTTP API → warehouse transition service → JSON snapshot. The delivery adapter calls the carrier simulator through HTTP on loopback. No commercial systems or cloud services are connected. The pure domain service uses the same carrier contract function as a deterministic test double when testing it without HTTP.

Receipt: ID, SKU, expected quantity and status. Stock lot: ID, SKU, location, zone, received timestamp, on-hand quantity and reserved quantity. Order: ID, SKU, required quantity, status and allocations by lot. Message: stable ID, mapped payload, attempt count, delivery state and latest response. Journal: sequential event ID, UTC timestamp, action and detail. Reset clears the journal; it is not a tamper-proof audit log. Earlier per-attempt response bodies are not retained, but response status/code remains in journal events.

## Rules and invariants

- Available = on hand − reserved. Allocation reserves; picking reduces both on hand and reserved; dispatch does not reduce stock again.
- Allocation first checks total available in the selected zone, so a shortage does not create partial reservations. FIFO orders by receipt date; LIFO reverses it.
- Putaway uses A-02 for AMBIENT or C-01 for CHILLED. Capacity checks the seeded 48-unit receipt as a single bin movement. This is intentionally not a generic capacity engine.
- State prerequisites prevent repeated receiving, putaway, picking and dispatch. One shipment creates one message. Delivered messages cannot be resent through the UI/API. This is a local duplicate guard, not distributed exactly-once delivery.
- Zone/rule changes apply to future actions; existing reservations are not reallocated. Existing queued payloads are only changed through explicit repair. The fault switch affects the next dispatch, not messages already queued.

## Interface specification

GET `/api/state` returns the current warehouse. POST `/api/{action}` accepts JSON. Actions: receive, putaway, allocate, pick, dispatch, reset (empty body); rules (`zone`, `allocation`, `maxPerBin`, `carrierCode`); fault (`enabled`); deliver and repair (`id`). Domain validation failures return HTTP 400 with `error`. Failed carrier acceptance is recorded in the message, while the action itself returns the current state with HTTP 200. Browser cross-origin writes are rejected. This is not an authentication control.

### Shipment mapping

POST `/carrier/v1/shipments`, Content-Type: application/json.

| Warehouse source | API target | Rule |
|---|---|---|
| order.id | shipmentId | SO-2081; stable shipment reference |
| order.sku | itemCode | SKU-TEA; identity mapping |
| order.qty | quantity | 24 units; no unit conversion |
| rules.carrierCode | carrierCode | DEMO-ROAD or DEMO-AIR; injected fault substitutes INVALID |

202 returns ACCEPTED and carrier reference. 422 returns UNKNOWN_CARRIER and `field: carrierCode`. This narrow simulator validates only carrier mapping; schema enforcement, partner authentication, retries with backoff and remote idempotency are future work. Transport timeout is three seconds; a transport error returns 400 and leaves the queued message available for manual retry. This lab demonstrates API mapping rather than claiming to implement an EDI standard such as EDIFACT DESADV.
