import { logout } from "@/app/auth/logout/actions";

export default function TrainerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
          <form action={logout}>
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium">
              Logout
            </button>
          </form>
        </div>
        <p className="text-gray-600">Trainer Dashboard — Coming Soon</p>
      </div>
    </div>
  );
}
