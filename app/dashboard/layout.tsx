import DashboardLayout from '@/components/layout/DashboardLayout';
import { ToastProvider } from '@/components/providers/ToastProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}
