# NOVERA RP v0.17.1 runtime sync

This branch tracks the current GTA5HOST runtime build used after v0.17.0.

## Fixed
- Boot order is now: disclaimer/loading -> start screen -> authorization.
- Removed the accidental giant NOVERA SVG overlay that stayed above Character Creator / Character Select.
- Hardened character appearance loading: head-blend parent IDs, colors, overlays and clothes are normalized before native RAGE MP calls. This prevents `setHeadBlendData: shapeFirstID is not an integer` for old/incomplete characters.
- Character Creator is split into `Гены`, `Внешность`, `Одежда` sections instead of one endless editor list.
- Final character step uses age 18–90 instead of date-of-birth input; server compatibility is preserved by converting age to the existing stored birth-date format at submit time.
- RP first/last name validation is enforced before submit.

## Runtime package
Generated package: `NOVERA RP v0.17.1.zip`.

Binary GTA/CEF assets are unchanged from the v0.17.0 runtime package; the code fixes are tracked on this branch.
