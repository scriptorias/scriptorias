import re, json
SECTIONS = [
  (1, 5, "Parable of Enoch on the Future Lot of the Wicked and the Righteous"),
  (6, 11, "The Fall of the Angels"),
  (12, 16, "Dream-Vision of Enoch"),
]
def section(n):
    return next(s for a, b, s in SECTIONS if a <= n <= b)
NUM = re.compile(r'(?:^|(?<=\s))(\d+[a-z]?)\.\s+')
LET = re.compile(r'^([a-z])\.\s+')
chapters = []
for n in range(1, 17):
    raw = open(f'/tmp/enoch/{n:02d}.txt', encoding='utf-8').read()
    raw = re.sub(r'[⌈⌉〈〉]', '', raw)
    verses, gap = [], 0
    for line in raw.split('\n'):
        s = line.strip()
        if not s:
            gap += 1; continue
        if s.startswith(('{{', '|', '}}', '=', 'CHAPTER')):
            gap = 0; continue
        lm = LET.match(s)
        marks = [(m.start(), m.end(), m.group(1)) for m in NUM.finditer(s)]
        if lm and not (marks and marks[0][0] == 0):
            marks.insert(0, (0, lm.end(), lm.group(1)))
        stanza = gap >= 2 and bool(verses)
        head = s[:marks[0][0]].strip() if marks else s
        if head:
            verses[-1]['lines'].append({'t': head, 'stanza': stanza} if stanza else head)
            stanza = False
        for i, (a, b, num) in enumerate(marks):
            end = marks[i + 1][0] if i + 1 < len(marks) else len(s)
            v = {'n': num, 'lines': [s[b:end].strip()]}
            if stanza and i == 0: v['stanza'] = True
            verses.append(v)
        gap = 0
    chapters.append({'n': n, 'title': section(n), 'verses': verses})
out = 'window.TEXTS = window.TEXTS || {};\n// R. H. Charles, The Book of Enoch (Oxford, 1912). Public domain. Source: Wikisource.\nwindow.TEXTS["1-enoch"] = ' + json.dumps({'translation': 'R. H. Charles (1912)', 'chapters': chapters}, ensure_ascii=False, indent=1) + ';\n'
open('data/1-enoch.js', 'w', encoding='utf-8').write(out)
for c in chapters:
    print(c['n'], len(c['verses']), [v['n'] for v in c['verses']])
