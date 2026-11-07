"""Resume prepared walkthroughs, respecting an already running render chain.

Usage: python -u scripts/resume-walkthrough-videos.py --labs 37-45
Each subprocess is bounded; completed players are skipped. No captures or live
model runs are started here. Recording reuses the existing audio cache.
"""
import argparse
import json
import subprocess
import sys
import time
from contextlib import ExitStack
from datetime import datetime, timezone
from pathlib import Path

import psutil
from production_clock import awake_time, active_production

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--labs', required=True)
    parser.add_argument('--after-pid', type=int)
    parser.add_argument('--after-status-name', help='Require this predecessor status file to report complete before starting')
    parser.add_argument('--status-name', default='walkthrough-resume-status.json')
    parser.add_argument('--record-only', action='store_true', help='Prepare cached narration while other labs render; do not render or publish')
    args = parser.parse_args()
    labs = []
    for part in args.labs.split(','):
        bounds = list(map(int, part.split('-')))
        labs.extend(range(bounds[0], bounds[-1] + 1))
    assert labs and all(4 <= n <= 75 for n in labs)
    assert Path(args.status_name).name == args.status_name and args.status_name.endswith('.json')
    if args.after_status_name:
        assert args.after_pid and Path(args.after_status_name).name == args.after_status_name and args.after_status_name.endswith('.json')
    state_path = ROOT / 'videos' / args.status_name
    state = {'pid': __import__('os').getpid(), 'labs': labs, 'completed': []}

    def status(stage, **extra):
        state.update(stage=stage, updated=datetime.now(timezone.utc).isoformat(), **extra)
        def read(path):
            try:
                return json.loads(path.read_text(encoding='utf-8'))
            except (FileNotFoundError, json.JSONDecodeError):
                # A child may be replacing its stage file at this instant.
                return {}
        def save(path, data):
            staged = path.with_name(path.name + f'.{state["pid"]}.tmp')
            staged.write_text(json.dumps(data, indent=2), encoding='utf-8')
            staged.replace(path)
        save(state_path, state)
        # Keep the user's open progress file current while a long build runs.
        summary_path = ROOT/'videos/continuation-status.json'
        summary = read(summary_path)
        production = []
        completed = []
        for number in range(1, 76):
            directory = ROOT/f'videos/managed-agents-lab{number:02}-walkthrough'
            path = directory/'production-status.json'
            if not path.exists():
                continue
            current = read(path)
            check_path = directory/'player-check.json'
            check = read(check_path)
            if current.get('stage') == 'complete' and check.get('chapterSeeking') == 'passed':
                completed.append(number)
            if number >= 41:
                production.append({'lab':number, 'stage':current.get('stage'),
                                   'player':check.get('chapterSeeking','not checked'),
                                   **({'error':current['error']} if 'error' in current else {})})
        summary.update(updated=state['updated'], completedVideoCount=len(completed),
                       completedVideoLabs=completed, production=production)
        scheduled_wait = bool(args.after_pid and stage == 'waiting_for_predecessor')
        if args.after_pid:
            summary.setdefault('scheduledProductionQueues', {})[state_path.relative_to(ROOT).as_posix()] = dict(state)
        if not scheduled_wait:
            summary['narrationQueueSnapshot' if args.record_only else 'renderQueueSnapshot'] = dict(state)
        if not args.record_only and not scheduled_wait:
            summary['renderQueue'] = state_path.relative_to(ROOT).as_posix()
            for draft in summary.get('decks', []) + summary.get('nextBatchDrafts', []) + summary.get('operationsBatchDrafts', []) + summary.get('upcomingLocalDrafts', []) + summary.get('integrationBatchDrafts', []) + summary.get('protocolBatchDrafts', []) + summary.get('finalBatchDrafts', []):
                if draft['lab'] in completed:
                    draft['state'] = 'video-complete-player-verified'
                elif draft['lab'] == state.get('lab') and draft['lab'] in labs:
                    draft['state'] = state['stage']
            summary['workStage'] = ('production-queue-complete' if stage == 'complete'
                                    else f'production-{stage}')
            if 50 in labs and 'lab50Approval' in summary:
                summary['lab50Approval']['productionStage'] = ('video-complete-player-verified'
                    if 50 in state['completed'] else stage if state.get('lab') == 50 else 'queued')
        save(summary_path, summary)
        print(json.dumps(state), flush=True)

    def run(command, log, timeout):
        with log.open('w', encoding='utf-8') as output:
            process = subprocess.Popen(command, cwd=ROOT, stdout=output,
                                       stderr=subprocess.STDOUT,
                                       creationflags=subprocess.CREATE_NO_WINDOW)
            deadline = awake_time() + timeout
            try:
                while True:
                    try:
                        code = process.wait(timeout=min(20,max(.01,deadline-awake_time())))
                        break
                    except subprocess.TimeoutExpired:
                        if awake_time() >= deadline:
                            raise
                        status(state['stage'])
            except subprocess.TimeoutExpired:
                owned = psutil.Process(process.pid)
                for child in reversed(owned.children(recursive=True)):
                    try:
                        child.kill()
                    except psutil.NoSuchProcess:
                        pass
                process.kill()
                process.wait(timeout=15)
                raise
        if code:
            raise RuntimeError(f'Command failed ({code}); see {log}')

    production_guard = ExitStack()
    try:
        if args.after_pid:
            # Wait only for the identified recovery runner, never a reused PID.
            try:
                predecessor = psutil.Process(args.after_pid)
                assert any('resume-walkthrough-videos.py' in x for x in predecessor.cmdline())
                status('waiting_for_predecessor', predecessorPid=args.after_pid)
                wait_deadline = awake_time() + 12 * 3600
                while predecessor.is_running():
                    try:
                        predecessor.wait(timeout=20)
                    except psutil.TimeoutExpired:
                        if awake_time() >= wait_deadline:
                            raise TimeoutError('Predecessor exceeded twelve awake hours')
            except psutil.NoSuchProcess:
                pass
            if args.after_status_name:
                predecessor_state = json.loads((ROOT/'videos'/args.after_status_name).read_text(encoding='utf-8'))
                if predecessor_state.get('stage') != 'complete':
                    raise RuntimeError('Predecessor queue did not complete; no new recording or render started')
        # The original shell may finish several labs, including their players.
        # Wait for it rather than racing its renderer or catalog writes.
        deadline = awake_time() + 12 * 3600
        while not args.record_only:
            active = []
            for process in psutil.process_iter(['pid', 'cmdline']):
                if process.pid == state['pid']:
                    continue
                command = process.info['cmdline'] or []
                if (any(Path(x).name == 'render-labs.sh' for x in command)
                        or (any(Path(x).name == 'build-narrated-presentation.py' for x in command)
                            and any('managed-agents-lab' in x for x in command))):
                    active.append(process.pid)
            if not active:
                break
            if awake_time() > deadline:
                raise TimeoutError('Existing render chain exceeded the recovery wait bound')
            status('waiting_for_existing_render', activePids=active)
            time.sleep(20)

        production_guard.enter_context(active_production())
        for lab in labs:
            project = f'managed-agents-lab{lab:02}-walkthrough'
            out = ROOT / 'videos' / project
            status('checking', lab=lab, activePids=[])
            if not (out / 'narration-plan.json').exists():
                raise FileNotFoundError(f'Lab {lab} has no prepared narration plan')
            if args.record_only:
                status('recording', lab=lab)
                run([sys.executable, '-u', 'scripts/record-presentation-video.py', '--project', project,
                     '--execute-authorized-recording'], out / 'pre-recording.log', 1800)
                state['completed'].append(lab)
                status('narration_ready', lab=lab)
                continue
            production = json.loads((out / 'production-status.json').read_text()) if (out / 'production-status.json').exists() else {}
            if production.get('stage') != 'complete':
                status('building', lab=lab)
                run([sys.executable, '-u', 'scripts/build-narrated-presentation.py', '--project', project], out / 'resume-build.log', 3600)
            status('publishing_player', lab=lab)
            run([sys.executable, 'scripts/finish-lab-walkthrough.py', str(lab)], out / 'resume-finish.log', 120)
            run(['node', 'scripts/check-lab-walkthrough-player.mjs', str(lab)], out / 'resume-player.log', 180)
            state['completed'].append(lab)
            status('validated', lab=lab)
        status('complete')
    except Exception as error:
        status('needs_review', error=str(error))
        raise
    finally:
        production_guard.close()


if __name__ == '__main__':
    main()
