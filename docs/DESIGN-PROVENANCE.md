# Design provenance and lock policy

- **Current authority for visual design:** `ChristinaVarneyRhynes330/we-the-parent-design-studio`, subject to founder approval of each page.
- **Initial source snapshot for this Sprint 1 package:** user-supplied `wtp (2).zip`, `wtp/src`, edited to remove Figma preview infrastructure and wire the secure data boundary. This is an earlier design-lineage snapshot, **not an assertion that every page matches the latest design repo**.
- **Approved visual properties to preserve:** warm dark champagne/gold glass, liquid/frosted panels, botanical assets, Newsreader and Figtree typography, page layouts, and responsive variants.
- **Transfer policy:** compare each page against the latest founder-approved reference; migrate design components intentionally; don't overwrite working data or privacy controls to recreate a prototype.
- **Demo separation:** `#/chat` and other demo routes use fictional browser-local data. Real case operations are limited to `#/app` or `#/signin`, which require valid Supabase configuration and server/data authorization.
- **Do not publish:** actual child information, private court records, stored original URLs, test sessions, or provider credentials.
