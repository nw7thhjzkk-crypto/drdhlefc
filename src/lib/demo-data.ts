/**
 * DEMO MODE — Isolated synthetic fixtures.
 * These are NEVER used in production. This file exists only for the
 * /demo route which renders clearly labeled demo views.
 * No real member data, payment data, or authentication is used.
 */

export const DEMO_PASSWORD = "BIKHU7";

export const demoOwner = {
  name: "Dr DHL Admin",
  email: "admin@drdhlefc-demo.com",
  role: "owner" as const,
};

export const demoTrainer = {
  name: "Rajesh Kumar",
  email: "rajesh@drdhlefc-demo.com",
  role: "trainer" as const,
  specialization: "Strength & Conditioning",
  qualification: "ACE Certified Personal Trainer",
};

export const demoMember = {
  name: "Priya Sharma",
  email: "priya@drdhlefc-demo.com",
  role: "member" as const,
  memberCode: "DHL-1001",
  phone: "+91 98765 43210",
  gender: "female" as const,
  fitnessGoal: "Weight Loss",
  status: "active" as const,
  membershipPlan: "Premium Quarterly",
  membershipExpiry: "2026-12-31",
  daysRemaining: 111,
};

export const demoMembers = [
  { id: "1", name: "Priya Sharma", code: "DHL-1001", status: "active", goal: "Weight Loss", trainer: "Rajesh Kumar", membership: "Premium Quarterly" },
  { id: "2", name: "Amit Patel", code: "DHL-1002", status: "active", goal: "Muscle Gain", trainer: "Rajesh Kumar", membership: "Gold Monthly" },
  { id: "3", name: "Neha Gupta", code: "DHL-1003", status: "active", goal: "General Fitness", trainer: "Sneha Reddy", membership: "Basic Monthly" },
  { id: "4", name: "Vikram Singh", code: "DHL-1004", status: "inactive", goal: "Strength", trainer: null, membership: "Expired" },
  { id: "5", name: "Ananya Desai", code: "DHL-1005", status: "active", goal: "Endurance", trainer: "Rajesh Kumar", membership: "Premium Quarterly" },
  { id: "6", name: "Karan Mehta", code: "DHL-1006", status: "active", goal: "Personal Training", trainer: "Sneha Reddy", membership: "Gold Monthly" },
  { id: "7", name: "Meera Joshi", code: "DHL-1007", status: "active", goal: "Weight Loss", trainer: "Rajesh Kumar", membership: "Premium Annual" },
  { id: "8", name: "Arjun Nair", code: "DHL-1008", status: "active", goal: "Muscle Gain", trainer: null, membership: "Basic Monthly" },
];

export const demoTrainers = [
  { id: "1", name: "Rajesh Kumar", specialization: "Strength & Conditioning", status: "active", assignedMembers: 5 },
  { id: "2", name: "Sneha Reddy", specialization: "Yoga & Mobility", status: "active", assignedMembers: 3 },
  { id: "3", name: "Mohammed Ali", specialization: "Cardio & HIIT", status: "active", assignedMembers: 0 },
];

export const demoMembershipPlans = [
  { id: "1", name: "Basic Monthly", duration: "30 days", price: 1999, type: "monthly" },
  { id: "2", name: "Gold Monthly", duration: "30 days", price: 3499, type: "monthly" },
  { id: "3", name: "Premium Quarterly", duration: "90 days", price: 8999, type: "quarterly" },
  { id: "4", name: "Premium Annual", duration: "365 days", price: 29999, type: "annual" },
];

export const demoPayments = [
  { id: "1", member: "Priya Sharma", amount: 8999, method: "UPI", date: "2026-09-01", plan: "Premium Quarterly" },
  { id: "2", member: "Amit Patel", amount: 3499, method: "Cash", date: "2026-09-03", plan: "Gold Monthly" },
  { id: "3", member: "Neha Gupta", amount: 1999, method: "Bank Transfer", date: "2026-09-05", plan: "Basic Monthly" },
  { id: "4", member: "Ananya Desai", amount: 8999, method: "UPI", date: "2026-09-07", plan: "Premium Quarterly" },
  { id: "5", member: "Karan Mehta", amount: 3499, method: "Cash", date: "2026-09-08", plan: "Gold Monthly" },
  { id: "6", member: "Meera Joshi", amount: 29999, method: "Bank Transfer", date: "2026-09-10", plan: "Premium Annual" },
];

export const demoAttendance = [
  { member: "Priya Sharma", date: "2026-09-11", time: "07:30 AM", method: "Manual" },
  { member: "Amit Patel", date: "2026-09-11", time: "08:15 AM", method: "Manual" },
  { member: "Neha Gupta", date: "2026-09-11", time: "09:00 AM", method: "Manual" },
  { member: "Ananya Desai", date: "2026-09-11", time: "06:45 AM", method: "Manual" },
  { member: "Karan Mehta", date: "2026-09-11", time: "10:30 AM", method: "Manual" },
];

export const demoActivities = [
  { id: "1", name: "Morning Yoga Flow", trainer: "Sneha Reddy", time: "6:00 AM", duration: "60 min", capacity: 20, booked: 12 },
  { id: "2", name: "HIIT Blast", trainer: "Mohammed Ali", time: "7:30 AM", duration: "45 min", capacity: 15, booked: 14 },
  { id: "3", name: "Strength Fundamentals", trainer: "Rajesh Kumar", time: "5:00 PM", duration: "60 min", capacity: 12, booked: 8 },
  { id: "4", name: "Evening Zumba", trainer: "Sneha Reddy", time: "6:30 PM", duration: "45 min", capacity: 25, booked: 20 },
  { id: "5", name: "Core Conditioning", trainer: "Mohammed Ali", time: "8:00 AM", duration: "30 min", capacity: 10, booked: 6 },
];

export const demoProducts = [
  { id: "1", name: "Protein Shake", sku: "SUP-001", price: 350, stock: 45, category: "Supplements" },
  { id: "2", name: "Resistance Band Set", sku: "EQ-001", price: 599, stock: 12, category: "Equipment" },
  { id: "3", name: "Water Bottle 1L", sku: "ACC-001", price: 299, stock: 30, category: "Accessories" },
  { id: "4", name: "Gym Towel", sku: "ACC-002", price: 199, stock: 50, category: "Accessories" },
  { id: "5", name: "BCAA Powder", sku: "SUP-002", price: 1299, stock: 8, category: "Supplements" },
];

export const demoLeads = [
  { id: "1", name: "Rahul Verma", phone: "+91 98765 11111", source: "Instagram", stage: "follow-up", followUp: "2026-09-12" },
  { id: "2", name: "Sneha Iyer", phone: "+91 98765 22222", source: "Walk-in", stage: "trial", followUp: "2026-09-15" },
  { id: "3", name: "Deepak Rao", phone: "+91 98765 33333", source: "Website", stage: "new", followUp: null },
  { id: "4", name: "Pooja Malhotra", phone: "+91 98765 44444", source: "Referral", stage: "contacted", followUp: "2026-09-13" },
];

export const demoNotifications = [
  { id: "1", title: "Membership Renewal", body: "Priya Sharma's membership expires in 30 days", time: "2 hours ago", read: false },
  { id: "2", title: "New Lead", body: "Deepak Rao submitted an inquiry via website", time: "5 hours ago", read: false },
  { id: "3", title: "Low Stock Alert", body: "BCAA Powder stock is below minimum level", time: "1 day ago", read: true },
  { id: "4", title: "Payment Received", body: "₹8,999 received from Priya Sharma via UPI", time: "1 day ago", read: true },
];

export const demoDashboardKPIs = {
  totalMembers: 8,
  activeMembers: 7,
  inactiveMembers: 1,
  newMembersThisMonth: 3,
  expiringMemberships: 2,
  todayCollection: 12498,
  weeklyCollection: 47494,
  monthlyCollection: 56994,
  outstandingDues: 3499,
  todayAttendance: 5,
  activeTrainers: 3,
  todayActivities: 5,
  storeSalesToday: 649,
  lowStockItems: 1,
  openLeads: 4,
};

export const demoMemberDietPlan = {
  name: "Weight Loss Plan — Week 1",
  goal: "Weight Loss",
  calories: 1800,
  protein: 120,
  carbs: 180,
  fat: 60,
  meals: [
    { time: "7:00 AM", name: "Pre-Workout", items: "Banana + Black Coffee" },
    { time: "8:30 AM", name: "Breakfast", items: "Oats with nuts + Boiled eggs (2)" },
    { time: "12:30 PM", name: "Lunch", items: "Grilled chicken salad + Brown rice" },
    { time: "4:00 PM", name: "Snack", items: "Greek yogurt + Almonds" },
    { time: "7:30 PM", name: "Dinner", items: "Paneer tikka + Sauteed vegetables" },
  ],
};

export const demoMemberWorkoutPlan = {
  name: "Beginner Strength — Week 1",
  goal: "Weight Loss",
  difficulty: "Beginner",
  duration: "45 min",
  exercises: [
    { name: "Treadmill Walk", sets: 1, reps: "10 min", rest: "—" },
    { name: "Goblet Squat", sets: 3, reps: "12", rest: "60s" },
    { name: "Dumbbell Press", sets: 3, reps: "10", rest: "60s" },
    { name: "Lat Pulldown", sets: 3, reps: "12", rest: "60s" },
    { name: "Plank", sets: 3, reps: "30s", rest: "45s" },
    { name: "Treadmill Walk", sets: 1, reps: "5 min", rest: "—" },
  ],
};

export const demoMemberAssessments = [
  { date: "2026-09-01", weight: 68.5, bmi: 26.2, bodyFat: "28%", muscleMass: "32%" },
  { date: "2026-08-01", weight: 69.2, bmi: 26.5, bodyFat: "29%", muscleMass: "31%" },
  { date: "2026-07-01", weight: 70.0, bmi: 26.8, bodyFat: "30%", muscleMass: "30%" },
];

export const demoMemberPayments = [
  { date: "2026-09-01", amount: 8999, method: "UPI", plan: "Premium Quarterly", status: "Paid" },
  { date: "2026-06-01", amount: 8999, method: "UPI", plan: "Premium Quarterly", status: "Paid" },
  { date: "2026-03-01", amount: 3499, method: "Cash", plan: "Gold Monthly", status: "Paid" },
];
