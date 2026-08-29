import subprocess

def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

failed_prs = [3, 5, 10, 11, 13, 21, 22, 33, 34]

for i in failed_prs:
    title = run_command(f"git log -1 --format='%s' origin/pr/{i}")
    print(f"PR {i}: {title}")
