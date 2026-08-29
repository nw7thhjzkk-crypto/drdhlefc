import subprocess

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

# Since my previous sandbox state might have been reset or lost between tasks,
# let's look at the full reflog without grep just in case.
res = run('git reflog -n 50')
print(res)
