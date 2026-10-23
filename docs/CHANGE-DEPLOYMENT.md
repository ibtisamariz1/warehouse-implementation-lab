# CHG-001 · Local lab release and configuration control

Scope: local WH-01 demo only. No production/customer release or approval is implied. Baseline 1.0: AMBIENT, FIFO, bin capacity 100, carrier DEMO-ROAD.

## Before change

1. Record reason, requester, impacted flow, old/new configuration and expected result in the record below.
2. Stop the server and copy `data/state.json` to a dated backup outside `data/` if it exists. Keep the prior application folder. Do not commit runtime data.
3. Run `node --test`. Review requirements and targeted scenarios. For this lab, use a fresh/reset dataset when comparing configurations.

## Deploy and verify

1. Copy the release folder to a local directory with Node 22+. No dependency installation is required.
2. Start with `node server.mjs`; verify the dashboard loads. For a clean demo use Reset sample data.
3. Complete SIT-01 and SIT-02, then the manual UAT scripts. Record observed results rather than assuming success from automated checks.
4. Record the baseline, release hash if using Git, date, tester, defects and decision. Explain changed pick strategy/locations to the operations reviewer before accepting the change.

## Rollback

Stop the server. Restore the prior application folder and compatible saved snapshot, then start and verify stock, receipt/order state and message status. Snapshot rollback reverts all activity since backup: reconcile movements and API acknowledgements first. This is safe for synthetic local data only; it is not a production rollback strategy.

## Change record template

Change ID: ____  Requester: ____  Reason: ____

Before / after values: ____  Impact and training notes: ____

Test evidence: ____  Operations acceptance: ____

Deployment date / owner: ____  Rollback location: ____  Outcome: ____

