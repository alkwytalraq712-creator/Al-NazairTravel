import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useEffect } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ADMIN_TOKEN_KEY } from '@/pages/login';

import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/login';
import { Dashboard } from '@/pages/dashboard';
import { Customers } from '@/pages/customers';
import { Employees } from '@/pages/employees';
import { Visas } from '@/pages/visas';
import { VisaApplications } from '@/pages/visa-applications';
import { Packages } from '@/pages/packages';
import { PackageBookings } from '@/pages/package-bookings';
import { FlightBookings } from '@/pages/flight-bookings';
import { Payments } from '@/pages/payments';
import { Invoices } from '@/pages/invoices';
import { Notifications } from '@/pages/notifications';
import { Banners } from '@/pages/banners';
import { Testimonials } from '@/pages/testimonials';
import { CompanySettings } from '@/pages/company-settings';
import { HoldSettings } from '@/pages/hold-settings';

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" nest>
        <MainLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/customers" component={Customers} />
            <Route path="/employees" component={Employees} />
            <Route path="/visas" component={Visas} />
            <Route path="/visa-applications" component={VisaApplications} />
            <Route path="/packages" component={Packages} />
            <Route path="/package-bookings" component={PackageBookings} />
            <Route path="/flight-bookings" component={FlightBookings} />
            <Route path="/payments" component={Payments} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/banners" component={Banners} />
            <Route path="/testimonials" component={Testimonials} />
            <Route path="/company-settings" component={CompanySettings} />
            <Route path="/hold-settings" component={HoldSettings} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthInit() {
  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      setAuthTokenGetter(() => token);
    }
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthInit />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
