# Learning Platform GitHub repository video

Student-facing title: **Claude Managed Agents Learning Platform — GitHub Repository**.

The walkthrough curates the README for Udemy students: obtaining the source,
Node 24 setup, local startup, the Home page and lab workflow, repository folders,
source inspection, included learning media, progress backups, three milestone
applications, the build-from-zero workbook, validation, optional live execution,
deployment guides and troubleshooting. Instructor filesystem paths, historical
implementation reports and author-only paid generation instructions are omitted.
The repository README itself is unchanged.

Public GitHub pages are captured read-only. Platform screenshots reuse actual
offline learning-platform captures. The source evidence records the README and
focused-guide hashes. No cloud deployment or live model session is needed for
this video; its narration uses the established separate author TTS workflow.

Generated output stays in the ignored `videos/github-repository-student-guide/`
folder. The final MP4 is `Claude-Managed-Agents-GitHub-Repository.mp4`. Supporting
files include English SRT/VTT captions, narration, cover, transcript, chaptered
`index.html`, student quick start, README selection notes and validation reports.
Use the final media validation report for the actual duration and completion
state; the presence of authored slides alone does not establish a finished MP4.

Rebuild from the repository root, stopping after any failed command:

```powershell
node scripts/capture-github-repository-video.mjs
python scripts/create-github-repository-video.py
node scripts/capture-video-storyboard.mjs --project github-repository-student-guide
python scripts/create-github-repository-video.py
python scripts/audit-video-storyboard.py --project github-repository-student-guide
python -u scripts/build-narrated-presentation.py --project github-repository-student-guide
python scripts/finish-github-repository-video.py
node scripts/check-video-player.mjs --project github-repository-student-guide
```

The author needs the existing local Python/media environment, Playwright/Edge,
the original course cover and platform capture assets, and a valid local Inworld
recording credential. Keep the credential private. The build reuses successful
recording caches and checks complete decoding, soundtrack synchronization,
transitions, embedded captions and timed highlights before final publication.
