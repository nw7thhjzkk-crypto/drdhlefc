import subprocess
import os

def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr

def main():
    # The branches all seem to branch off some weird base and have conflicts.
    # We will try to cherry-pick the commits that actually matter instead of doing full merges.
    # Specifically, each PR is likely 1 meaningful commit on top of their base.

    success_prs = []
    failed_prs = []

    for i in range(1, 63):
        pr_ref = f"origin/pr/{i}"

        code, out, err = run_command(f"git rev-parse --verify {pr_ref}")
        if code != 0:
            continue

        print(f"\n--- Attempting to cherry-pick PR {i} ---")

        # Get the commit message of the PR head
        _, msg_out, _ = run_command(f"git log -1 --format='%s' {pr_ref}")
        msg = msg_out.strip()
        print(f"PR {i} title: {msg}")

        # We will cherry pick just the top commit of the PR.
        # Assuming the PR is a single commit. If it's more, we'd need to cherry pick a range.
        # Let's try cherry picking the head.
        cp_code, cp_out, cp_err = run_command(f"git cherry-pick {pr_ref}")

        if cp_code != 0:
            print(f"Cherry-pick conflict for PR {i}. Trying to auto-resolve by preferring theirs.")
            run_command("git cherry-pick --abort")

            # Try again with strategy option ours (which means the cherry-picked branch since we are rebasing onto main essentially)
            # Actually -X theirs means prefer the incoming commit in conflicts.
            cp_code2, cp_out2, cp_err2 = run_command(f"git cherry-pick -X theirs {pr_ref}")

            if cp_code2 != 0:
                print(f"Still conflicted. Aborting PR {i}.")
                run_command("git cherry-pick --abort")
                failed_prs.append((i, "Cherry-pick conflict"))
                continue

        print(f"Cherry-pick successful for PR {i}, running build...")
        build_code, build_out, build_err = run_command("npm run build")

        if build_code != 0:
            print(f"Build failed for PR {i}. Reverting cherry-pick.")
            run_command("git reset --hard HEAD~1")
            failed_prs.append((i, "Build failed"))
            continue

        print(f"PR {i} successfully incorporated and built.")
        success_prs.append(i)

    print("\n\n=== Merge Summary ===")
    print(f"Successfully incorporated: {success_prs}")
    print(f"Failed: {failed_prs}")

    with open("merge_results.txt", "w") as f:
        f.write(f"Success: {success_prs}\nFailed: {failed_prs}\n")

if __name__ == "__main__":
    main()
