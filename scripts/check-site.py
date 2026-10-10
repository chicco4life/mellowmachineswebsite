import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SITE = json.loads((ROOT / 'content/site.json').read_text())

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0; self.ids = set(); self.references = []; self.canonical = []; self.description = ''
        self.images = []; self.schema = []; self.in_schema = False; self.buffer = ''; self.lang = ''
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html': self.lang = attrs.get('lang')
        if tag == 'h1': self.h1 += 1
        if 'id' in attrs: self.ids.add(attrs['id'])
        if tag == 'meta' and attrs.get('name') == 'description': self.description = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical.append(attrs.get('href'))
        if tag in ('a', 'link') and 'href' in attrs: self.references.append(attrs['href'])
        if tag == 'img':
            self.images.append(attrs); self.references.append(attrs['src'])
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.in_schema = True; self.buffer = ''
    def handle_endtag(self, tag):
        if tag == 'script' and self.in_schema:
            self.schema.append(json.loads(self.buffer)); self.in_schema = False
    def handle_data(self, text):
        if self.in_schema: self.buffer += text

pages = {}
for path in DIST.rglob('*.html'):
    doc = Document(); doc.feed(path.read_text()); pages[path] = doc
    assert doc.lang == 'en', path
    assert doc.h1 == 1, (path, doc.h1)
    assert doc.description and len(doc.description) <= 260, path
    assert len(doc.canonical) == 1, path
    assert all('alt' in img for img in doc.images), path
    if 'buddygotchi' not in path.parts: assert doc.schema, path

checked = 0
for path, doc in pages.items():
    for ref in doc.references:
        parts = urlsplit(ref)
        if parts.scheme or parts.netloc: continue
        target = DIST / unquote(parts.path).lstrip('/') if parts.path.startswith('/') else path.parent / unquote(parts.path)
        if not parts.path: target = path
        if target.is_dir(): target = target / 'index.html'
        assert target.exists(), (path, ref)
        if parts.fragment:
            assert target in pages and unquote(parts.fragment) in pages[target].ids, (path, ref)
        checked += 1

for resource in json.loads((ROOT / 'content/resources.json').read_text()):
    if resource['url'].startswith('/'):
        assert (DIST / resource['url'].strip('/') / 'index.html').exists()

home = (DIST / 'index.html').read_text()
assert 'System One Models' in home and 'Jev' in home and 'ESP32' in home
assert '/learn/mellowharness-quickstart/' in home and '/learn/esp32-ai-agent/' in home
assert 'co-founders' not in home.lower()
for path in pages:
    assert '127.0.0.1:5173' not in path.read_text(), path
    assert 'publication-workspace' not in path.read_text(), path
    if path != DIST / 'learn/mellowharness/index.html':
        assert pages[path].canonical == [SITE['origin'] + '/' + str(path.relative_to(DIST)).removesuffix('index.html').removesuffix('/404.html').removesuffix('404.html')] or path == DIST / '404.html', (path, pages[path].canonical)
assert pages[DIST / 'learn/mellowharness/index.html'].canonical == ['https://mellowmachines.substack.com/p/mellowharness-for-responsive-ai-hardware']
sitemap = ET.parse(DIST / 'sitemap.xml')
urls = [entry.text for entry in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
articles = json.loads((ROOT / 'content/articles.json').read_text())
expected = {SITE['origin'] + route for route in ['/', '/learn/', '/buddygotchi/'] + [a['path'] for a in articles if not a.get('canonical')]}
assert set(urls) == expected and len(urls) == len(expected)
feed = ET.parse(DIST / 'feed.xml')
assert len(feed.findall('./channel/item')) == len([a for a in articles if not a.get('canonical')])
publications = json.loads((ROOT / 'content/publications.json').read_text())
library = (DIST / 'learn/index.html').read_text()
assert all(p['url'] in library for p in publications)
assert all('https://github.com/Mellow-Machines-Lab/' + name in library for name in ['MellowHarness', 'buddygotchi', 'AgentHooks', '.github'])
assert '/learn/buddygotchi-build/' in home and '/learn/esp32-parts-list/' in home
assert all(url.startswith(SITE['origin'] + '/') for url in urls)
assert 'Sitemap: ' + SITE['origin'] + '/sitemap.xml' in (DIST / 'robots.txt').read_text()
report = {'passed': True, 'htmlPages': len(pages), 'localReferencesChecked': checked, 'sitemapURLs': len(urls), 'checks': ['one heading per page', 'metadata and structured data', 'local links and fragments', 'image alternative text', 'all resource routes', 'confirmed domain', 'original sharing canonical', 'private workspace excluded']}
(ROOT / 'outputs').mkdir(exist_ok=True)
(ROOT / 'outputs/source-verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
