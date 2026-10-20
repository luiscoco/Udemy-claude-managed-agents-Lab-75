# Lab 50 lab walkthrough image prompt

Use after P14 and before P16. Generate an original image, inspect it against its actual lesson, and measure the final panels. Supply an approved style reference if the tool supports references; the prompt's reference wording is not an attached file. It must not copy Agent SDK API claims. The pose and content below are specific to this image. Generative output is not pixel deterministic.

COPY PROMPT START

````text
Create an educational 1672x941 infographic in the same bright pastel/navy/orange style as the reference, titled 'How Claude Managed Agents Works', 'Lab 50 — Lab walkthrough', 'Full stack capstone: guided experiment'. This is an offline fictional customer-support teaching app using toy customers C-1 and C-2, no real transactions or personal data. Illustrate RESPONSIBLE customer service and authorization, no tactics for fraud. White astronaut with blue visor standing beside a customer-service console and pointing at a reviewed clipboard, a distinct pose. Six numbered uneven panels: top row 3 panels, middle row 2 panels, bottom full-width short strip. Panel 1 Prepare the baseline: select fictional C-1, inspect its own order, request a partial damaged-item refund; diagram customer -> owned order -> pending trusted review. Panel 2 Run the comparison: reviewer DENIES the proposal -> no refund ledger entry -> inspect unchanged remaining balance and audit. Panel 3 Inspect the boundary: reviewer APPROVES a new eligible proposal once -> one checked ledger entry; immutable single-use review, repeated approval cannot create another effect. Panel 4 Follow the workflow: switch to fictional C-2; host ownership validation refuses access to an unrelated customer's order; untrusted note is data and cannot grant authority. Show distinct safe ownership lanes, no exploitation details. Panel 5 Verify the result: customer ownership, positive integer cents, policy eligibility, remaining paid balance, trusted review, checked idempotent ledger. A model's promise alone does not establish a refund. Panel 6 Reflect and record: deny a request, verify no refund recorded, record observed result and limits; saved note is self-assessment, not live execution evidence. Use readable minimal text with diagrams, arrows with correct conditions, high quality icons, no fake API fields or amounts. Footer 'Illustrated teaching summary — inspect actual exercise evidence.' Preserve six panels and astronaut, no red highlights baked in.
````

COPY PROMPT END

## Observed correction prompt

This corrected the instructor's generated candidate. Apply only if the same defect exists in your candidate; preserve all other correct content and inspect again. Do not blindly edit a differently composed image.

COPY PROMPT START

````text
Edit the fictional educational customer-service infographic. Preserve all six panels, layout, astronaut and other content. Panel 2 is a reviewer choosing to deny an otherwise eligible teaching request. Replace caption 'Reviewer DENIES the proposed refund. It is not eligible.' with 'Reviewer chooses DENY. Eligibility alone does not grant approval.' Panel 6 first clipboard caption replace 'Choose a request that is not eligible' with 'Choose the pending teaching request and select Deny.' No claim that every denied request is ineligible. In panel 5 Policy eligibility tile add concise 'Within remaining paid balance'. Everything else unchanged.
````

COPY PROMPT END
