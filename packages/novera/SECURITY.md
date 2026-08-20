# Baseline server authority rules

- Money changes are server-side only.
- Amounts are converted to finite positive integers and checked against balances.
- Job identifiers are allowlisted.
- Ownership actions must be validated server-side before persistence.
- Client/CEF data is never trusted as authoritative state.
- Character age must remain 18–90 and GTA appearance IDs must be normalized to integers before native calls.
