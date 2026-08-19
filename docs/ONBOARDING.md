# New-player onboarding

On first character selection the server atomically grants the starter state once: wallet initialization, character stats, smartphone, ID card, food/water and the `onboarding.arrival` quest. A persistent `starter_granted` flag prevents reconnects or concurrent events from duplicating the starter kit.

The narrative/client-side onboarding sequence will advance the quest through documents, transport, first job and temporary housing without changing the trusted server-side grant rules.
