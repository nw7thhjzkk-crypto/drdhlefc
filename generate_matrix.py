import json

matrix_md = """
| Module | UI | Backend | DB | RLS | Audit | Validation | Tests | Status |
|---|---|---|---|---|---|---|---|---|
| **Owner: Member Mgmt** | Yes | Yes | Yes | Yes | No | Yes | Some | PARTIALLY COMPLETE |
| **Owner: Trainer Mgmt** | Yes | Yes | Yes | Yes | No | Yes | Some | PARTIALLY COMPLETE |
| **Owner: Memberships/Payments** | Yes | Yes | Yes | Yes | No | Yes | Some | PARTIALLY COMPLETE |
| **Owner: Diet Plans** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Owner: Workout Plans** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Owner: Store/POS** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Owner: Leads/CRM** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Owner: Group Activities** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Owner: Audit Log** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Owner: Settings** | Stub | No | No | No | No | No | No | NOT IMPLEMENTED |
| **Trainer: Dashboard** | Stub | No | n/a | n/a | No | No | No | NOT IMPLEMENTED |
| **Trainer: Assigned Members** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Trainer: Member Profile/Progress** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Trainer: Attendance** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Member: Dashboard** | Stub | No | n/a | n/a | No | No | No | NOT IMPLEMENTED |
| **Member: Diet** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Member: Workout** | Stub | No | Yes | Yes | No | No | No | NOT IMPLEMENTED |
| **Integration: Google Drive** | Stub | Stub | n/a | n/a | No | No | No | NOT IMPLEMENTED |
| **Integration: Gemini AI** | Stub | Stub | n/a | n/a | No | No | No | NOT IMPLEMENTED |
"""
with open("audit_matrix.md", "w") as f:
    f.write(matrix_md)
