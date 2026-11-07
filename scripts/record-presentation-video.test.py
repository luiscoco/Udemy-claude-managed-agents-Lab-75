"""Regression checks for interrupted cached merges; no provider requests."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import wave

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('recorder', ROOT/'scripts/record-presentation-video.py')
recorder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recorder)


class InterruptedMergeTests(unittest.TestCase):
    def setUp(self):
        artifacts = ROOT/'artifacts'
        self.directory = tempfile.TemporaryDirectory(prefix='narration-regression-', dir=artifacts)
        self.cache = Path(self.directory.name).resolve()
        assert self.cache.parent == artifacts.resolve()
        self.original_cache = recorder.CACHE
        recorder.CACHE = self.cache
        self.settings = {'voiceId': 'test-fixture'}
        self.segments = [
            {'id': 'first', 'text': 'Alpha ' + 'alpha '*40, 'target': {}},
            {'id': 'second', 'text': 'Beta ' + 'beta '*45, 'target': {}},
        ]
        # Each chunk fits one synthesis window; their combined text does not.
        for segment in self.segments:
            segment['text'] = segment['text'].strip()
        self.row = {'segments': self.segments}
        words, starts, ends, sources = [], [], [], []
        offset = 0
        for segment, duration in zip(self.segments, [1.0, 1.25]):
            key = self.key(segment['text'])
            audio = self.cache/f'{key}.mp3'
            self.encode_fixture(audio, duration)
            tokens = segment['text'].split()
            step = duration/len(tokens)
            alignment = {'words': tokens,
                         'wordStartTimeSeconds': [i*step for i in range(len(tokens))],
                         'wordEndTimeSeconds': [(i+.8)*step for i in range(len(tokens))]}
            audio.with_suffix('.json').write_text(json.dumps({'timestampInfo': {'wordAlignment': alignment}}))
            words.extend(tokens)
            starts.extend(t+offset for t in alignment['wordStartTimeSeconds'])
            ends.extend(t+offset for t in alignment['wordEndTimeSeconds'])
            sources.append(audio.name)
            offset += recorder.decode(audio)
        full_text = ' '.join(s['text'] for s in self.segments)
        self.merged = self.cache/f'merged-{self.key(full_text)}.mp3'
        self.encode_fixture(self.merged, .25)
        self.merged.with_suffix('.json').write_text(json.dumps({
            'joinedFrom': sources, 'timestampInfo': {'wordAlignment': {
                'words': words, 'wordStartTimeSeconds': starts, 'wordEndTimeSeconds': ends}}}))

    def key(self, text):
        return hashlib.sha256(json.dumps({**self.settings, 'text': text}, sort_keys=True).encode()).hexdigest()

    def encode_fixture(self, audio, duration):
        wav = self.cache/'fixture.wav'
        with wave.open(str(wav), 'wb') as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(48000)
            output.writeframes(b'\0\0'*round(duration*48000))
        subprocess.run([recorder.FFMPEG, '-v', 'error', '-y', '-i', str(wav),
                        '-c:a', 'libmp3lame', str(audio)], check=True, capture_output=True)
        wav.unlink()

    def tearDown(self):
        recorder.CACHE = self.original_cache
        self.directory.cleanup()

    def test_truncated_merge_is_rebuilt_from_cached_clips_without_requests(self):
        with patch.object(recorder.SESSION, 'post', side_effect=AssertionError('No paid request allowed')) as post:
            audio, cues, duration, reused = recorder.slide_audio(self.row, self.settings, {})
            self.assertTrue(reused)
            self.assertEqual(audio, self.merged)
            self.assertAlmostEqual(duration, 2.25, places=2)
            recorder.validate_timing(cues, duration)
            post.assert_not_called()
            digest = hashlib.sha256(audio.read_bytes()).hexdigest()
            self.assertTrue(recorder.slide_audio(self.row, self.settings, {})[3])
            self.assertEqual(hashlib.sha256(audio.read_bytes()).hexdigest(), digest)

    def test_failed_encoding_preserves_existing_cache_and_cleans_staging_files(self):
        before = self.merged.read_bytes()
        metadata = self.merged.with_suffix('.json').read_bytes()
        original_run = recorder.subprocess.run

        def fail_encoder(command, **kwargs):
            if '-c:a' in command:
                return subprocess.CompletedProcess(command, 1, b'', b'simulated encoder failure')
            return original_run(command, **kwargs)

        with patch.object(recorder.SESSION, 'post', side_effect=AssertionError('No paid request allowed')):
            with patch.object(recorder.subprocess, 'run', side_effect=fail_encoder):
                with self.assertRaisesRegex(AssertionError, 'simulated encoder failure'):
                    recorder.slide_audio(self.row, self.settings, {})
        self.assertEqual(self.merged.read_bytes(), before)
        self.assertEqual(self.merged.with_suffix('.json').read_bytes(), metadata)
        self.assertEqual(list(self.cache.glob('.record-*')), [])

    def test_recorder_lock_rejects_overlap_and_releases_after_error(self):
        with self.assertRaisesRegex(ValueError, 'simulated interruption'):
            with recorder.recording_lock(self.cache):
                with self.assertRaisesRegex(RuntimeError, 'already using'):
                    with recorder.recording_lock(self.cache):
                        self.fail('Concurrent recorder acquired the same project cache')
                raise ValueError('simulated interruption')
        with recorder.recording_lock(self.cache):
            pass


if __name__ == '__main__':
    unittest.main()
