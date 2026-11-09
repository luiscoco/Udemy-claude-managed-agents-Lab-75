"""Create a readable offline HTML version of the deployment guide."""
import importlib.util
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('student_docs', ROOT / 'scripts/package-aws-student-kit.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text = (ROOT / 'gcp/README.md').read_text(encoding='utf-8')
css = '''body{font:16px/1.6 Arial,sans-serif;color:#17334b;max-width:980px;margin:35px auto;padding:0 25px}h1{font-size:30px;color:#123d60}h2{font-size:22px;border-bottom:1px solid #ccd8e2;padding-bottom:6px;margin-top:30px}pre{background:#eff4f8;border:1px solid #cbd7e1;padding:14px;white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 Consolas,monospace}li{margin:6px 0}a{color:#145d91;overflow-wrap:anywhere}@media print{body{max-width:none;margin:0;padding:0;font-size:10pt}h1{font-size:22pt}h2{font-size:15pt;break-after:avoid}pre{font-size:8pt;break-inside:avoid}p,li{orphans:3;widows:3}a{color:inherit;text-decoration:none}}'''
document = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Google Cloud Deployment Student Guide</title><style>' + css + '</style><main>' + module.markdown_html(text) + '</main></html>'
(ROOT / 'gcp/STUDENT-GUIDE.html').write_text(document, encoding='utf-8')
shutil.copy2(ROOT / 'gcp/STUDENT-GUIDE.html', ROOT / 'videos/gcp-cloud-run-deployment/student-deployment-guide.html')
print('Prepared offline Google Cloud deployment guide.')
