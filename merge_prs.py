import subprocess
import os

def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr

def main():
    success_prs = []
    failed_prs = []

    # We'll sort by numeric order. In reality, some dependencies exist,
    # but sequential merging is a safe first pass.
    # If one fails to merge or build, we skip it.
    for i in range(1, 63):
        pr_ref = f"origin/pr/{i}"

        # Check if PR exists
        code, out, err = run_command(f"git rev-parse --verify {pr_ref}")
        if code != 0:
            continue

        print(f"\n--- Attempting to merge PR {i} ---")

        # Merge allowing unrelated histories in case they were generated disconnectedly
        merge_code, merge_out, merge_err = run_command(f"git merge {pr_ref} --allow-unrelated-histories -X theirs --no-edit -m 'Merge PR {i}'")

        if merge_code != 0:
            print(f"Merge conflict for PR {i}. Aborting merge.")
            run_command("git merge --abort")
            failed_prs.append((i, "Merge conflict"))
            continue

        # Build check
        print(f"Merge successful for PR {i}, running build...")
        build_code, build_out, build_err = run_command("npm run build")

        if build_code != 0:
            print(f"Build failed for PR {i}. Reverting merge.")
            run_command("git reset --hard HEAD~1")
            failed_prs.append((i, "Build failed"))
            continue

        print(f"PR {i} successfully merged and built.")
        success_prs.append(i)

    print("\n\n=== Merge Summary ===")
    print(f"Successfully merged: {success_prs}")
    print(f"Failed to merge: {failed_prs}")

    with open("merge_results.txt", "w") as f:
        f.write(f"Success: {success_prs}\nFailed: {failed_prs}\n")

if __name__ == "__main__":
    main()
