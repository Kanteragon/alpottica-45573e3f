<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Homepage maintenance uses the shared site setting, defaulting on when unavailable so the notice remains visible during a database outage; disabling the persisted setting restores the original homepage.
- Shared image uploaders use dnd-kit pointer and keyboard sorting with separate delete controls so dragging supports touch and cannot intercept deletion clicks.
- Homepage section visibility and ordering come from homepage_sections; category cards come from showcase_categories, with explicit public-read grants and admin-only write policies.
- Homepage custom-script markup mounts in the homepage before the footer; injection tracks moved nodes so navigation removes them cleanly.
- Cart suggestion eligibility and complete messages live in a browser-safe pure module so nearest-tier selection and missing quantities can be regression-tested independently of data fetching.
