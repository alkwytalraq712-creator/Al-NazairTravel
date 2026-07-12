/**
 * ServiceSettingsContext — fetches which services are enabled from the API.
 * All screens read from here; no polling after mount (staleTime=30s in hook).
 */
import React, { createContext, useContext } from 'react';
import { useGetServiceSettings } from '@workspace/api-client-react';

interface ServiceSettingsCtx {
  flightsEnabled: boolean;
  packagesEnabled: boolean;
  visasEnabled: boolean;
  isLoading: boolean;
}

const Ctx = createContext<ServiceSettingsCtx>({
  flightsEnabled: true,
  packagesEnabled: true,
  visasEnabled: true,
  isLoading: false,
});

export function ServiceSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetServiceSettings();

  const value: ServiceSettingsCtx = {
    flightsEnabled:  data?.flightsEnabled  ?? true,
    packagesEnabled: data?.packagesEnabled ?? true,
    visasEnabled:    data?.visasEnabled    ?? true,
    isLoading,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useServiceSettings() {
  return useContext(Ctx);
}
