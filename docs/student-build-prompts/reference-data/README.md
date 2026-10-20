# Use the teaching and media reference data

Keep these supplied files outside the empty app while beginning F01. Your coding assistant may read them as reference data. Use reference-versions.json for the frozen resolved package versions, course.json for the 75 lesson contracts and media-catalog.json for matching instructor recordings/images.

The media catalog is intentionally complete and large. Read it programmatically and select one lesson; do not paste it all into a chat request. For example, load JSON with Node, filter guideClips by lessonId and visuals by lessonId, then inspect those entries only. Each guide clip provides the exact step, rendered segment IDs/text and recording metadata. Copy the referenced MP3 and timing JSON from the teacher-provided media archive.

Each visual entry contains lessonId, kind, title, regions and asset metadata. Reconstruct the visual catalog value with only lessonId, kind, title and regions, in that order, before comparing its serialized SHA-256 to asset.contentSha256. The asset field belongs to the manifest, not that content hash. Keep the exact supplied narration, guide targets, source paths, region IDs and measured boxes when reusing the supplied images/MP3s.

A changed transcript needs a matching new recording; a newly generated image needs its own measured bounds and identity. No fabricated timestamps or stale-hash relabeling is valid. Do not treat this authored data as provider output or a live test result. Full downloadable media is supplied separately from this small prompt package.
