import glob
import re

for fp in glob.glob('public/*.html'):
    with open(fp, 'r') as f:
        text = f.read()
    
    # regex to match parseSum(\'something\') and replace with parseSum('something')
    # literally backslash quote
    text = text.replace(r"parseSum(\'", "parseSum('")
    text = text.replace(r"\')", "')")
    
    with open(fp, 'w') as f:
        f.write(text)
print("done")
