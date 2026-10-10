"""Check static discoverability, factual metadata and public evidence boundaries."""
import csv
import json
import re
import statistics
from datetime import date
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SITE = json.loads((ROOT / 'content/site.json').read_text())
GUIDES = json.loads((ROOT / 'content/articles.json').read_text())
ORIGIN = SITE['origin']

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []; self.title = ''; self.in_title = False
        self.hidden = False; self.schema = []; self.in_schema = False; self.buffer = ''
        self.meta = {}; self.canonical = ''; self.visible = ''
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a' and 'href' in a: self.links.append(a['href'])
        if tag == 'title': self.in_title = True
        if tag in ('script', 'style'): self.hidden = True
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.in_schema = True; self.buffer = ''
        if tag == 'meta': self.meta[a.get('name', a.get('property'))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a['href']
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script' and self.in_schema:
            self.schema.extend(json.loads(self.buffer)['@graph']); self.in_schema = False
        if tag in ('script', 'style'): self.hidden = False
    def handle_data(self, value):
        if self.in_title: self.title += value
        if self.in_schema: self.buffer += value
        elif not self.hidden: self.visible += value + ' '

def read_page(route):
    return Page((DIST / route.strip('/') / 'index.html').read_text())

routes = ['/', '/learn/', '/buddygotchi/'] + [g['path'] for g in GUIDES]
pages = {route: read_page(route) for route in routes}
titles = [p.title for p in pages.values()]
assert len(set(titles)) == len(titles), 'Duplicate titles'
descriptions = [p.meta['description'] for p in pages.values()]
assert len(set(descriptions)) == len(descriptions), 'Duplicate descriptions'
# Reachability using initial HTML links only: no JavaScript execution or sitemap shortcut.
visited = set(); queue = ['/']
while queue:
    route = queue.pop(0)
    if route in visited: continue
    visited.add(route)
    for link in pages[route].links:
        u = urlsplit(link)
        target = u.path or route
        if (not u.netloc or u.netloc == urlsplit(ORIGIN).netloc) and target in pages and target not in visited:
            queue.append(target)
assert visited == set(routes), ('Orphan routes', set(routes) - visited)

for g in GUIDES:
    page = pages[g['path']]
    assert 'noindex' not in page.meta.get('robots', '')
    article = next(s for s in page.schema if s['@type'] == 'TechArticle')
    assert [a['name'] for a in article['author']] == [a['name'] for a in SITE['authors']]
    assert article['datePublished'][:10] == g.get('published', g['added'])
    assert article['dateModified'][:10] == g['updated']
    assert date.fromisoformat(g['added']) <= date.fromisoformat(g['updated'])
    assert all(date.fromisoformat(g[k]) <= date(2026, 10, 10) for k in ('added','updated','sourceChecked'))
    assert len(next(s for s in page.schema if s['@type'] == 'BreadcrumbList')['itemListElement']) == 3
    if not g.get('canonical'):
        assert article['mainEntityOfPage'] == ORIGIN + g['path'] == page.canonical
    assert all(u in page.links for u in article['citation']), 'Invisible source citation'

sitemap = ET.parse(DIST / 'sitemap.xml')
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
entries = {x.find('s:loc',ns).text: x.find('s:lastmod',ns).text for x in sitemap.findall('s:url',ns)}
for g in GUIDES:
    if not g.get('canonical'): assert entries[ORIGIN+g['path']] == g['updated']
assert ORIGIN + '/learn/mellowharness/' not in entries

data = json.loads((DIST / 'assets/jev-latency.json').read_text())
latencies = data['latencies_ms']
assert len(latencies) == 105 and statistics.median(latencies) == 227
assert sum(v < 500 for v in latencies) == 95
assert min(latencies) == 185 and max(latencies) == 1103
assert data['summary']['bins_100ms'] == [sum(i*100 <= v < (i+1)*100 for v in latencies) for i in range(12)]
assert data['unique_input_contexts'] == 34
assert 'source_path' not in data
assert not any(x in (DIST / 'assets/jev-latency.json').read_text() for x in ('/Users/', 'questions', 'state":'))
assert set(data) == {'latencies_ms','summary','source_sha256','measurement','date','audited','brain','dropped_passes','original_software_commit','immutable_model_version','unique_input_contexts'}
with (DIST / 'assets/jev-latency.csv').open() as f:
    rows = list(csv.DictReader(f))
assert [int(row['latency_ms']) for row in rows] == latencies
assert [int(row['pass_index']) for row in rows] == list(range(1,106))

text = (ROOT / 'content/agent-harness-design.md').read_text()
fixture = re.search(r'```jsonl\n(.*?)\n```', text, re.S)[1]
events = [json.loads(line) for line in fixture.splitlines()]
assert [e['seq'] for e in events] == [41,42,43,44]
assert [e['at'] for e in events] == sorted(e['at'] for e in events)
assert all(e['data'].get('for') == 41 for e in events[1:])
answer = events[2]['data']['answers']['mood']
assert isinstance(answer,dict) and answer['choice'] in answer['p']
assert events[2]['data']['dropped'] is None

for route,p in pages.items():
    assert not any(t in p.visible for t in ('publication-workspace', '/Users/work/', 'question-panel.csv'))
    assert not any(s['@type'] in ('Offer','AggregateRating') for s in p.schema)

report = {'passed':True,'staticReachableRoutes':len(visited),'originalGuideURLs':len(GUIDES)-1,'timingObservations':len(latencies),'checks':['unique titles and descriptions','all article routes reachable in static HTML','visible sources match schema','authorship and truthful dates','complete breadcrumbs','canonical sitemap dates','full latency data integrity and privacy','synthetic JSONL matches decision record shape'],'limits':['No production crawl/indexing result','No real-user Core Web Vitals result','No externally configured analytics or webmaster properties']}
(ROOT / 'outputs/seo-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
