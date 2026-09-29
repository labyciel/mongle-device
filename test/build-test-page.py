# 모바일 테스트판(한 파일 HTML) 만들기: python3 test/build-test-page.py <출력경로>
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(root, p), encoding='utf-8').read()
idx, css = rd('public/index.html'), rd('public/style.css')
core, mock, app = rd('public/core.js'), rd('test/mock-server.js'), rd('public/app.js')
body = re.search(r'<body>(.*?)<script src="core.js">', idx, re.S).group(1)
# index.html의 추가 스타일 (html/body/[hidden] 기본값은 Artifact가 제공하므로 제외)
inline = re.search(r'<style>(.*?)</style>', idx, re.S).group(1)
inline = '\n'.join(l for l in inline.splitlines() if not re.match(r'\s*(html|body|\[hidden\])\{', l))
banner = '<p class="testbanner">테스트 모드 · 서버 대신 이 브라우저 안에서 돌아가요. 데이터는 이 기기에만 저장되고, 결투장의 샘플트레이너들은 테스트용이에요.</p>'
body = body.replace('</header>', '</header>\n  ' + banner, 1)
extra = '.testbanner{margin:0;font-size:12.5px;padding:8px 12px;border-radius:10px;border:1px dashed var(--warn);color:var(--muted)}\n'
out = f'''<title>몽글 디바이스 테스트</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=IBM+Plex+Sans+KR:wght@400;500;700&family=Nanum+Gothic+Coding:wght@400;700&display=swap">
<style>
{css}{inline}
{extra}</style>
{body.strip()}
<script>
{core}
</script>
<script>
{mock}
</script>
<script>
{app}
</script>
'''
open(sys.argv[1], 'w', encoding='utf-8').write(out)
print('wrote', sys.argv[1], len(out))
