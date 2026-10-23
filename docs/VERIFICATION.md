# Verification record · 24 October 2026

Environment: Windows, Node.js v24.22.1. Command: `node --test`.

Result: **8 tests passed, 0 failed**. Includes seven domain scenarios and one real HTTP integration scenario testing static assets, successful carrier acceptance, invalid mapping rejection, repair/retry, closing stock and cross-origin write rejection. Loopback networking required running the HTTP tests outside the restricted execution sandbox.

Browser execution: completed receive → putaway → FIFO allocate → pick → fault injection → dispatch → rejected delivery → repair → successful retry in the embedded browser. Observed closing stock 36, zero reservations, order DISPATCHED, MSG-0001 DELIVERED with two attempts and 202 ACCEPTED. Screenshot: `../demo.png`.

This records an agent-executed lab walkthrough, not independent warehouse operations acceptance or customer UAT sign-off. Responsive CSS is provided; a full multi-device/browser acceptance sweep was not performed. Persistence was tested by snapshot round-trip at domain level, not by browser restart.

The running local demonstration retains the completed walkthrough. Use Reset sample data to begin again. The downloadable source archive excludes runtime state, so it starts with fresh sample data.
