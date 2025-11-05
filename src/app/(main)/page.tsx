"use client";
import { useUserStore } from '@/stores/useUserStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { useDataStore } from '@/stores/useLocationDataStore';

import { PatientQueue } from '@/components/home/PatientQueue';
import { PatientForm } from '@/components/home/PatientForm';

export default function HomePage() {
  const user = useUserStore((state) => state.user);
  const username = user?.username;
  const location = useLocationStore((state) => state.currentLocation);
  const { all_patients } = useDataStore();

  return (
    <div className="min-h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
              <h1 className="text-2xl text-black font-bold text-foreground">
                Welcome, {username} !
              </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden bg-background w-full">
        <div className="flex w-full gap-6">
          <div className="w-1/3 min-w-[300px]">
            <PatientQueue />
          </div>
          <div className="flex-1 min-w-[600px] flex">
            <PatientForm
              existingPatients={all_patients}
              onSubmit={() => {}} 
              locationId={location?.id}
            />
          </div>
        </div>
      </main>
    </div>
  )
}