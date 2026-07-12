/**
 * FlightBookingContext — lightweight context to carry booking state
 * between search → results → details → seats → travelers → review → success.
 *
 * No extra state library needed — plain React context + useState.
 */
import React, { createContext, useContext, useState } from 'react';
import type { FlightOffer, PassengerInput, SeatSelection, FlightSearchParams } from '@/lib/flightService';

export interface FlightBookingState {
  // Search params
  searchParams: FlightSearchParams | null;
  // Selected offer
  offer: FlightOffer | null;
  // Seat selections (one per passenger)
  seatSelections: SeatSelection[];
  // Traveler details
  passengers: PassengerInput[];
  // Contact info
  phone: string;
  email: string;
}

interface FlightBookingContextType {
  state: FlightBookingState;
  setSearchParams: (p: FlightSearchParams) => void;
  setOffer: (o: FlightOffer) => void;
  setSeatSelections: (s: SeatSelection[]) => void;
  setPassengers: (p: PassengerInput[]) => void;
  setContact: (phone: string, email: string) => void;
  reset: () => void;
}

const INITIAL: FlightBookingState = {
  searchParams: null,
  offer: null,
  seatSelections: [],
  passengers: [],
  phone: '',
  email: '',
};

const FlightBookingContext = createContext<FlightBookingContextType | null>(null);

export function FlightBookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlightBookingState>(INITIAL);

  const setSearchParams = (searchParams: FlightSearchParams) =>
    setState(s => ({ ...s, searchParams }));

  const setOffer = (offer: FlightOffer) =>
    setState(s => ({ ...s, offer }));

  const setSeatSelections = (seatSelections: SeatSelection[]) =>
    setState(s => ({ ...s, seatSelections }));

  const setPassengers = (passengers: PassengerInput[]) =>
    setState(s => ({ ...s, passengers }));

  const setContact = (phone: string, email: string) =>
    setState(s => ({ ...s, phone, email }));

  const reset = () => setState(INITIAL);

  return (
    <FlightBookingContext.Provider
      value={{ state, setSearchParams, setOffer, setSeatSelections, setPassengers, setContact, reset }}
    >
      {children}
    </FlightBookingContext.Provider>
  );
}

export function useFlightBookingContext() {
  const ctx = useContext(FlightBookingContext);
  if (!ctx) throw new Error('useFlightBookingContext must be used within FlightBookingProvider');
  return ctx;
}
