# INC-001 · Carrier mapping rejection (simulated incident)

**Impact:** warehouse order SO-2081 is dispatched but its carrier notification is not accepted. Inventory remains correct. Carrier booking visibility is delayed in the simulated downstream system.

**Reproduce:** reset, receive, putaway, allocate, pick; enable fault injection; dispatch; send MSG-0001. Observe HTTP 422, UNKNOWN_CARRIER, `field: carrierCode`, payload value INVALID. Journal records dispatch followed by rejected API response.

**Root cause:** the outbound mapping supplied a carrier code outside the receiver's accepted code set. In this lab, an explicit fault switch simulates configuration drift; it is not a real production incident. Evidence is the invalid mapped field and deterministic receiver response. Repeated sending without correction produces the same rejection.

**Recovery:** check configured carrier mapping is DEMO-ROAD or DEMO-AIR; repair MSG-0001; retry delivery. Verify status DELIVERED, response 202, attempt count 2, same message ID and stock still 36. Disable injection for future dispatches. Disabling it alone does not repair an existing payload.

**Implemented prevention:** normal configuration validates the allowed carrier code set; explicit repair is recorded; duplicate delivery after acceptance is blocked locally. Fault injection deliberately bypasses mapping validation to make the scenario reproducible.

**Further corrective actions for a real implementation:** versioned partner code lists, schema validation before queueing, alerts on rejected messages, remote idempotency keys, immutable attempt history and reconciliation of dispatched shipments against carrier acknowledgements. Assign real owners and deadlines only in a real project.
