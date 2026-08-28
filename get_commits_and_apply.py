import subprocess

def run_command(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr

def main():
    success_prs = []
    failed_prs = []

    for i in range(1, 63):
        pr_ref = f"origin/pr/{i}"

        code, out, err = run_command(f"git rev-parse --verify {pr_ref}")
        if code != 0:
            continue

        print(f"\n--- Attempting to apply PR {i} via patch ---")

        # Get the commit message of the PR head
        code, msg_out, _ = run_command(f"git log -1 --format='%s' {pr_ref}")
        msg = msg_out.strip()
        print(f"PR {i} top commit: {msg}")

        # We know the PR is essentially 1 commit away from some base.
        # But we only want the diff introduced by the top commit, or maybe the diff between the PR branch and its common ancestor with main?
        # A safer bet: The PRs were likely branched off some snapshot of main (e.g., 0ff1ebb)
        # We can extract the patch of just the top commit of the PR.
        commit_hash = run_command(f"git log -1 --format='%H' {pr_ref}")[1].strip()

        code, patch, _ = run_command(f"git format-patch -1 {commit_hash} --stdout")

        with open("temp.patch", "w") as f:
            f.write(patch)

        # Try to apply the patch
        apply_code, apply_out, apply_err = run_command("git am -3 temp.patch")

        if apply_code != 0:
            print(f"Patch conflict for PR {i}. Aborting patch.")
            run_command("git am --abort")
            failed_prs.append((i, "Patch conflict"))
            continue

        print(f"Patch successful for PR {i}, running build...")
        build_code, build_out, build_err = run_command("npm run build")

        if build_code != 0:
            print(f"Build failed for PR {i}. Reverting patch.")
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
