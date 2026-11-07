"""Verify the complete course after the last production queue finishes.

Reads existing validation evidence and hashes the delivered MP4 files. This
does not record narration, make provider requests or rerun media decoding.
"""
import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import psutil
from production_clock import awake_time

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def save(path, value):
    staged = path.with_name(f'{path.name}.{os.getpid()}.tmp')
    staged.write_text(json.dumps(value, indent=2), encoding='utf-8')
    staged.replace(path)


def check(lab):
    directory = ROOT / f'videos/managed-agents-lab{lab:02}-walkthrough'
    production = read(directory / 'production-status.json')
    validation = read(directory / 'validation.json')
    player = read(directory / 'player-check.json')
    timeline = read(directory / 'timeline.json')
    storyboard = read(ROOT / f'presentations/managed-agents-lab{lab:02}-walkthrough/storyboard.json')
    assert production['stage'] == 'complete', 'Production incomplete'
    assert validation['fullVideoAndAudioDecode'] == 'passed', 'Decode validation missing'
    assert validation['resolution'] == [1920, 1080] and validation['fps'] == 30, 'Video format differs'
    assert player['chapterSeeking'] == 'passed', 'Player seeking failed'
    assert player['metadata']['error'] is None, 'Player media error'
    assert player['metadata']['width'] == 1920 and player['metadata']['height'] == 1080, 'Player dimensions differ'
    assert abs(player['metadata']['duration'] - validation['durationSeconds']) <= 0.1, 'Player duration differs'
    scenes = len(timeline['slides'])
    assert player['chapterLinks'] == validation['slides'] == scenes == len(storyboard), 'Chapter or scene count differs'
    assert validation['cubeTransitionsVerified'] == scenes - 1, 'Transition verification incomplete'
    filename = validation['file']
    assert Path(filename).name == filename and filename.endswith('.mp4'), 'Unexpected media path'
    video = directory / filename
    assert video.stat().st_size == validation['bytes'], 'MP4 size changed'
    with video.open('rb') as media:
        digest = hashlib.file_digest(media, 'sha256').hexdigest()
    assert digest == validation['sha256'] == production['sha256'], 'MP4 digest changed'
    assert (directory / 'index.html').is_file() and (directory / 'cover.png').is_file(), 'Published player incomplete'
    return dict(lab=lab, file=video.relative_to(ROOT).as_posix(), sha256=digest,
                bytes=validation['bytes'], durationSeconds=validation['durationSeconds'],
                chapters=scenes, wordAlignedHighlights=validation['wordAlignedHighlightsVerified'],
                decode='passed', player='passed')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--after-pid', type=int)
    parser.add_argument('--after-status-name')
    parser.add_argument('--preflight', type=int, help='Check one completed lab without writing final status')
    args = parser.parse_args()
    if args.preflight:
        assert 1 <= args.preflight <= 75
        print(json.dumps(check(args.preflight)), flush=True)
        return
    report_path = ROOT / 'videos/course-final-audit.json'
    report = dict(pid=os.getpid(), stage='waiting_for_production', verified=[], errors=[])
    def status(stage):
        report.update(stage=stage, updated=datetime.now(timezone.utc).isoformat())
        save(report_path, report)
    try:
        if args.after_pid:
            assert args.after_status_name and Path(args.after_status_name).name == args.after_status_name
            try:
                predecessor = psutil.Process(args.after_pid)
                assert any(Path(part).name == 'resume-walkthrough-videos.py' for part in predecessor.cmdline()), 'Unexpected predecessor process'
                deadline = awake_time() + 12 * 3600
                while predecessor.is_running():
                    status('waiting_for_production')
                    try:
                        predecessor.wait(timeout=30)
                    except psutil.TimeoutExpired:
                        if awake_time() >= deadline:
                            raise TimeoutError('Final queue wait exceeded twelve hours')
            except psutil.NoSuchProcess:
                pass
            predecessor_state = read(ROOT / 'videos' / args.after_status_name)
            assert predecessor_state.get('stage') == 'complete', 'Final production queue did not complete'
        status('checking')
        for lab in range(1, 76):
            try:
                report['verified'].append(check(lab))
            except (AssertionError, OSError, KeyError, ValueError) as error:
                report['errors'].append(dict(lab=lab, error=str(error)))
            status('checking')
        assert len(report['verified']) == 75 and not report['errors'], 'Course validation requires review'
        report['totalDurationSeconds'] = sum(item['durationSeconds'] for item in report['verified'])
        report['totalBytes'] = sum(item['bytes'] for item in report['verified'])
        report['totalChapters'] = sum(item['chapters'] for item in report['verified'])
        status('passed')
    except Exception as error:
        report['error'] = str(error)
        status('needs_review')
        raise
    finally:
        summary_path = ROOT / 'videos/continuation-status.json'
        summary = read(summary_path)
        summary['finalCourseAudit'] = dict(path='videos/course-final-audit.json', stage=report['stage'],
                                         verified=len(report['verified']), errors=report['errors'])
        if report['stage'] == 'passed':
            summary.update(workStage='all-75-videos-verified', completedVideoCount=75,
                           completedVideoLabs=list(range(1, 76)), updated=report['updated'])
        save(summary_path, summary)


if __name__ == '__main__':
    main()
