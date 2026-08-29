import subprocess

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

branches = [
    "main",
    "main-ui-impl",
    "feature-complete-ui",
    "jules-9743545895368865022-6fac27f7"
]

print("--- LOCAL SEARCH FOR UI BRANCHES ---")
for b in branches:
    res = run(f"git rev-parse --verify {b} 2>/dev/null")
    if res.strip():
        print(f"FOUND locally: {b} -> {res.strip()}")
        print(run(f"git log -n 3 --oneline {b}"))
    else:
        print(f"NOT FOUND locally: {b}")

print("\n--- SEARCHING REFLOG FOR LOST COMMITS ---")
# Search reflog for "docs: finalize implementation report in PHASES.md" or "feat(diet,workout)"
res = run('git reflog | grep -E "feat|ui|implement|docs: finalize"')
print(res)
