# Portfolio explanation

## Project description

I built an independent warehouse implementation lab inspired by common Dispatcher-style WMS workflows. It covers inbound receiving, configurable putaway, lot inventory, FIFO/LIFO allocation, picking, dispatch and a local HTTP carrier integration. I documented the requirements, mapping, test scenarios, simulated incident RCA and deployment/rollback procedure.

The project demonstrates how I translate operations requirements into configuration and testable behavior. It does not use Blue Yonder Dispatcher or CargoWrite, and I do not present it as licensed product experience.

## Suggested cover-letter paragraph

To develop practical application engineering skills relevant to this role, I built an independent WMS implementation lab covering receiving through dispatch, configurable warehouse rules and a JSON API integration. I created FAT/SIT-style scenarios, operations UAT scripts, a reproducible mapping failure with root cause analysis, and change/deployment documentation. This project has strengthened my understanding of warehouse processes and implementation discipline, which I would bring to learning DSV's CargoWrite and Blue Yonder Dispatcher environment.

## Interview walkthrough

Start with the business requirement, explain when reservations and physical stock change, demonstrate the failed API mapping, and show recovery without dispatching twice. Connect each demonstration to its design requirement and test scenario. Explain that the carrier endpoint and data are local simulations. Discuss how transactional storage, remote idempotency, authentication and immutable audit history would change the design for real operations.

Avoid statements such as “implemented Blue Yonder Dispatcher”, “configured CargoWrite”, “DSV project”, or “production WMS experience” based solely on this lab. Describe manual UAT as a planned or personally executed exercise unless an actual reviewer has completed it.
