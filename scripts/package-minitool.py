"""Package the already built and browser-checked offline artifact; standard library only."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
from zipfile import ZipFile, ZIP_DEFLATED

sys.stdout.reconfigure(encoding='utf-8')
workspace = Path(__file__).resolve().parent.parent
root = workspace / 'artifacts' / 'minitool'
archive = root.parent / 'birthday-room-minitool.zip'
allowed = {'.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2'}
files = sorted(p for p in root.rglob('*') if p.is_file())
assert (root / 'index.html').is_file(), 'Missing root index.html'
for file in files:
    assert not file.is_symlink() and file.suffix in allowed, f'Unsupported entry: {file}'
    assert root in file.resolve().parents, f'Path outside artifact: {file}'
    if file.suffix not in {'.html', '.css'}:
        continue
    source = file.read_text(encoding='utf-8')
    refs = re.findall(r'(?:src|href)=["\']([^"\']+)', source) if file.suffix == '.html' else re.findall(r'url\(["\']?([^"\')]+)', source)
    for ref in refs:
        assert not re.match(r'^(?:[a-z]+:|/)', ref, re.I), f'Non-relative resource: {ref}'
        target = (file.parent / ref).resolve()
        assert root in target.parents and target.is_file(), f'Missing/outside resource: {ref}'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED, compresslevel=9) as z:
    for file in files:
        z.write(file, file.relative_to(root).as_posix())
skill = workspace / '.codex' / 'minitool-zip-builder'
audits = []
for target in [root, archive]:
    result = subprocess.run([sys.executable, str(skill / 'scripts' / 'audit_artifact.py'), str(target)], capture_output=True, encoding='utf-8', env={**__import__('os').environ, 'PYTHONIOENCODING': 'utf-8'})
    audits.append({'target': str(target), 'exitCode': result.returncode, 'output': result.stdout + result.stderr})
    assert result.returncode == 0, audits[-1]['output']
result = {'archive': str(archive), 'bytes': archive.stat().st_size, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': len(files), 'uncompressedBytes': sum(p.stat().st_size for p in files), 'audits': audits}
(root.parent / 'package-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
