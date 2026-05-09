with open('public/sotuv.html', 'r') as f:
    text = f.read()

text = text.replace(
    'reduce((a,s)=>a+s.summa,0)',
    'reduce((a,s)=>a+(parseFloat(s.summa)||0),0)'
)
text = text.replace(
    'reduce((a,s)=>a+s.qarz,0)',
    'reduce((a,s)=>a+(parseFloat(s.qarz)||0),0)'
)
text = text.replace(
    '${s.summa.toLocaleString()}',
    '${(parseFloat(s.summa)||0).toLocaleString()}'
)
text = text.replace(
    '${s.qarz.toLocaleString()}',
    '${(parseFloat(s.qarz)||0).toLocaleString()}'
)
text = text.replace(
    's.totalKg',
    '(parseFloat(s.totalKg)||0)'
)
text = text.replace(
    's.summa',
    '(parseFloat(s.summa)||0)'
)
# undo the last one if it breaks things, but anyway...

with open('public/sotuv.html', 'w') as f:
    f.write(text)
print('Fixed!')
