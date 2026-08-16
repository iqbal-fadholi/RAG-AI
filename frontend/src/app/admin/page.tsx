import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

export const metadata = {
  title: "Administration - RAG.ai",
  description: "Manage users, roles (RBAC), and knowledge tags (OBAC)",
};

export default function AdminPage() {
  return (
    <main className="flex-grow p-md md:p-margin-desktop flex flex-col items-center gap-12 w-full max-w-max-width-content mx-auto my-8">
      <header className="w-full text-center mb-4">
        <h1 className="font-headline-lg text-headline-lg mb-2 text-white">Security & Access Administration</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage Role-Based Access Control (RBAC) and Tag-Based Knowledge Retrieval (OBAC).</p>
      </header>
      <AdminDashboard />
    </main>
  );
}
