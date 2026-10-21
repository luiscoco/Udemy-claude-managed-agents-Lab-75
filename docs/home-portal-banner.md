# Home portal presentation banner

The Home introduction uses `public/images/portal-welcome.png`, generated with the built-in image tool from the instructor-supplied presentation reference. The original output is retained outside the repository; the app uses its workspace copy. The 1672x941 banner is approximately 16:9 and is shown without cropping. It introduces the complete portal, with the author card and astronaut, rather than presenting Lesson C01.

The full [copyable student implementation and artwork prompts](student-build-prompts/13-home-portal-banner.md) are also included in P01, WORKBOOK.md and the generated student prompt ZIP. Reuse the supplied instructor asset; students need the instructor reference to reproduce the author portrait. The image is included in new course source ZIPs, not in the text-only student prompt ZIP.

The portal keeps real accessible heading, summary and attribution text. The text is shown on phones and used as a fallback when the image is missing or the registered catalog is incomplete. The poster is only shown for the actual 75-lesson catalog. Start navigation and all following Home sections remain available.

Validation: TypeScript checking, production build and 18 existing Home/navigation checks passed. Production visual review covered light/dark themes at 320, 390, 768, 1280 and 1920px, without image cropping or horizontal page overflow. Missing-image and partial-catalog fallbacks, real accessible heading, phone text and Start navigation were checked; no exercise POST occurred. Desktop and phone screenshots were inspected.

The local course source ZIP includes the banner and all 3,015 authored members matched their distribution-manifest hashes. All 290 student prompt ZIP file hashes also matched, including the new standalone prompt. Banner SHA-256: `4061d0df26286810cd7d1db7eaf18e0dd485209e0a43c94e1fd14d4091c111d4`. Screenshots and UI measurements are under `artifacts/visual-style/portal-home-*`; package verification is in `artifacts/ci/home-banner-verification.json`. These are local results, separate from the earlier hosted regression's tested commit.

The cover preserves its intrinsic 1672x941 ratio using automatic height, contain scaling and a native-width cap. Home provides an original-resolution link. This prevents layout stretching; it cannot reverse portrait changes already baked into the generated bitmap. Restoring the instructor's exact original photo requires that original image to be supplied.
