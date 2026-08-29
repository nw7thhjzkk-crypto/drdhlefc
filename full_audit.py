import os
import subprocess

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

# 1. Audit what files actually exist and their sizes
print("--- AUDITING FILES ---")
routes_to_check = [
    "src/app/(owner)/owner/store/page.tsx",
    "src/app/(owner)/owner/leads/page.tsx",
    "src/app/(member)/member/home/page.tsx",
    "src/app/(member)/member/diet/page.tsx",
    "src/utils/googleDrive.ts",
    "src/utils/gemini.ts"
]

for route in routes_to_check:
    if os.path.exists(route):
        size = os.path.getsize(route)
        print(f"EXISTS: {route} ({size} bytes)")
    else:
        print(f"MISSING: {route}")

# 2. Check for actual DB structure logic (e.g. store_sales)
print("\n--- CHECKING SCHEMA MIGRATIONS ---")
res = run("ls -la supabase/migrations")
print(res.stdout)
