import { redirect } from "next/navigation";

/** Legacy stub route — membership/payments UI lives at /member/payments. */
export default function MemberPlans() {
  redirect("/member/payments");
}
