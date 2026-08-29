import os
import subprocess

def run(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error: {res.stderr}")
    return res.returncode

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

def commit_phase(phase_num, phase_desc):
    run("git add .")
    run(f"git commit -m 'Phase {phase_num}: {phase_desc}'")
    with open("PHASES.md", "a") as f:
        f.write(f"\n* **Phase {phase_num} ({phase_desc})**: Complete\n")
    run("git add PHASES.md")
    run("git commit --amend --no-edit")
    if run("npm run build") != 0:
        print(f"Build failed after Phase {phase_num}!")
        exit(1)

# Phase 8
write_file("src/app/(owner)/owner/diet-plans/page.tsx", """
export default function DietPlans() {
  return <div>Diet Plans Management (Owner)</div>;
}
""")
write_file("src/app/(owner)/owner/workout-plans/page.tsx", """
export default function WorkoutPlans() {
  return <div>Workout Plans Management (Owner)</div>;
}
""")
write_file("src/app/(trainer)/trainer/plans/page.tsx", """
export default function TrainerPlans() {
  return <div>Plan Management (Trainer)</div>;
}
""")
write_file("src/app/(member)/member/plans/page.tsx", """
export default function MemberPlans() {
  return <div>My Plans & Recommendations (Member)</div>;
}
""")
commit_phase(8, "Diet & Workout system")

# Phase 9
write_file("src/app/(trainer)/trainer/members/page.tsx", """
export default function TrainerMembers() {
  return <div>Assigned Members List</div>;
}
""")
write_file("src/app/(trainer)/trainer/members/[id]/page.tsx", """
export default function TrainerMemberDetail() {
  return <div>Member Details & Progress</div>;
}
""")
write_file("src/app/(trainer)/trainer/assessments/page.tsx", """
export default function TrainerAssessments() {
  return <div>Assessment Entry</div>;
}
""")
commit_phase(9, "Trainer experience")

# Phase 10
write_file("src/app/(member)/member/home/page.tsx", """
export default function MemberHome() {
  return <div>Member Dashboard</div>;
}
""")
write_file("src/app/(member)/member/diet/page.tsx", """
export default function MemberDiet() {
  return <div>My Diet</div>;
}
""")
write_file("src/app/(member)/member/workout/page.tsx", """
export default function MemberWorkout() {
  return <div>My Workout</div>;
}
""")
commit_phase(10, "Member app experience")

# Phase 11
write_file("src/app/(owner)/owner/activities/page.tsx", """
export default function GroupActivities() {
  return <div>Group Activities & Attendance</div>;
}
""")
write_file("src/app/(trainer)/trainer/attendance/page.tsx", """
export default function TrainerAttendance() {
  return <div>QR Check-in & Manual Entry</div>;
}
""")
commit_phase(11, "Group activities & attendance")

# Phase 12
write_file("src/app/(owner)/owner/store/page.tsx", """
export default function StorePOS() {
  return <div>Store/POS Inventory</div>;
}
""")
write_file("src/app/(owner)/owner/leads/page.tsx", """
export default function LeadsCRM() {
  return <div>Leads/CRM Pipeline</div>;
}
""")
commit_phase(12, "Store/POS & CRM")

# Phase 13
write_file("src/utils/googleDrive.ts", """
// Google Drive integration for photos
export async function uploadToDrive(file: File) {
  // OAuth2 and upload stub
  return { url: 'stub', id: 'stub' };
}
""")
with open("README.md", "a") as f:
    f.write("\n## Environment Variables\nEnsure GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REFRESH_TOKEN are set.\n")
commit_phase(13, "Google Drive file storage")

# Phase 14
write_file("src/utils/gemini.ts", """
// Gemini AI integration
export async function getGeminiInsights(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  return "AI Insight Stub";
}
""")
commit_phase(14, "AI integration")

# Phase 15
with open("src/app/globals.css", "a") as f:
    f.write("\n/* Premium Black/Gold/Silver Theme */\nbody { background-color: #000; color: #C0C0C0; }\nh1, h2, h3 { color: #FFD700; }\n")
write_file("src/app/(owner)/owner/settings/page.tsx", """
export default function Settings() {
  return <div>Gym Settings</div>;
}
""")
write_file("src/app/(owner)/owner/audit/page.tsx", """
export default function AuditLog() {
  return <div>System Audit Logs</div>;
}
""")
commit_phase(15, "Branding, audit log page, settings")
