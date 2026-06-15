import { Outlet } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';

interface AppLayoutOutletProps {
  immersive?: boolean;
}

export function AppLayoutOutlet({ immersive = false }: AppLayoutOutletProps) {
  return (
    <AppLayout immersive={immersive}>
      <Outlet />
    </AppLayout>
  );
}

export default AppLayoutOutlet;
