import subprocess
import os

def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr

def main():
    success_prs = []
    failed_prs = []

    # Base commit where the divergent branch likely started.
    # Notice that PR 1 has commits like 0ff1ebb, 23a57f6, 0c1c4d6, 13acd75, 8422222, 6d93292.
    # But those commits are NOT in origin/main (which ends at 2221874).
    # This means the PRs were made against a different branch or commit history.

    for i in range(1, 63):
        pr_ref = f"origin/pr/{i}"

        code, out, err = run_command(f"git rev-parse --verify {pr_ref}")
        if code != 0:
            continue

        print(f"\n--- Attempting to extract and apply PR {i} changes ---")

        # Step 1: Find the common ancestor with origin/main, or just find the top commit of the PR.
        # Often the PR itself is just the top 1 commit relative to the branch it was created from.
        # We can extract the file changes of the top commit and apply them.

        pr_head_commit = run_command(f"git log -1 --format='%H' {pr_ref}")[1].strip()

        # We can diff the PR head with its direct parent.
        # This gets just the changes made IN THAT PR.
        code, diff_out, _ = run_command(f"git diff {pr_head_commit}^ {pr_head_commit}")

        with open("pr.diff", "w") as f:
            f.write(diff_out)

        # Try applying the diff using git apply
        apply_code, apply_out, apply_err = run_command("git apply --3way pr.diff")

        if apply_code != 0:
            print(f"Apply failed for PR {i}. Aborting.")
            run_command("git reset --hard HEAD")
            failed_prs.append((i, "Apply conflict"))
            continue

        # Commit the applied diff
        msg = run_command(f"git log -1 --format='%s' {pr_ref}")[1].strip()
        run_command("git add .")
        run_command(f"git commit -m \"{msg}\"")

        print(f"Apply successful for PR {i}, running build...")
        build_code, build_out, build_err = run_command("npm run build")

        if build_code != 0:
            print(f"Build failed for PR {i}. Reverting commit.")
            run_command("git reset --hard HEAD~1")
            failed_prs.append((i, "Build failed"))
            continue

        print(f"PR {i} successfully incorporated and built.")
        success_prs.append(i)

    print("\n\n=== Summary ===")
    print(f"Successfully incorporated: {success_prs}")
    print(f"Failed: {failed_prs}")

    with open("merge_results.txt", "w") as f:
        f.write(f"Success: {success_prs}\nFailed: {failed_prs}\n")

if __name__ == "__main__":
    main()
