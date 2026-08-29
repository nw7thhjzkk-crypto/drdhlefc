import subprocess

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()

print("Analyzing branches for functional UI implementation...")

branches = run("git branch -a").split('\n')
for b in branches:
    b = b.strip().replace("* ", "")
    if 'main-ui-impl' in b or 'feature-complete-ui' in b:
        print(f"\nBranch: {b}")
        log = run(f"git log -n 5 --oneline {b} 2>/dev/null")
        print(f"Recent commits:\n{log}")
