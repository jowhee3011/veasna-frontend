'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import LocationDropdown from "./LocationDropdown";
import { useLocationStore } from "@/stores/useLocationStore";
import { useDataStore } from "@/stores/useLocationDataStore";
import { useEffect, useState } from "react";
import { Location } from "@/lib/types/location";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { getLocations } from "@/lib/api/location";
import { LocalPattern } from "next/dist/shared/lib/image-config";
import toast from "react-hot-toast";

export default function TopNav() {
  const locations = useLocationStore((state) => state.locations);
  const setLocations = useLocationStore((state) => state.setLocations);
  const fetchData = useDataStore((state) => state.fetchData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Define an async function inside the effect
    const fetchLocations = async () => {
      if (locations.length === 0) {
        try {
          const dbLocations = await getLocations();
          setLocations(dbLocations);
        } catch (e) {
          toast.error("An error has occurred");
        }
      }
    };

    fetchLocations(); // Call it
  }, [locations, setLocations]);


  useEffect(() => {
    setLocations(locations);
  }, [locations, setLocations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  }

  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const linkBaseClass = "mr-[20px] pb-2 border-b-2 transition-colors duration-200";
  const activeLinkClass = "border-white";
  const inactiveLinkClass = "border-transparent hover:border-white/50";

  return (
    <nav className="flex-grow bg-blue-default text-white font-bold py-[13px]">
      <div className="flex justify-between items-center mx-10">
        {/* Navigation Links */}
        <div className="flex">
          <Link
            href="/"
            className={`${linkBaseClass} ${isActive('/') ? activeLinkClass : inactiveLinkClass}`}
          >
            Home
          </Link>
          <Link
            href="/patient-list"
            className={`${linkBaseClass} ${isActive('/patient-list') ? activeLinkClass : inactiveLinkClass}`}
          >
            Patient List
          </Link>
          <Link
            href="/triage"
            className={`${linkBaseClass} ${isActive('/triage') ? activeLinkClass : inactiveLinkClass}`}
          >
            Triage
          </Link>
          <Link
            href="/seva"
            className={`${linkBaseClass} ${isActive('/seva') ? activeLinkClass : inactiveLinkClass}`}
          >
            Seva
          </Link>
          <Link
            href="/physiotherapy"
            className={`${linkBaseClass} ${isActive('/physiotherapy') ? activeLinkClass : inactiveLinkClass}`}
          >
            Physiotherapy
          </Link>
          <Link
            href="/doctors-consultation"
            className={`${linkBaseClass} ${isActive('/doctors-consultation') ? activeLinkClass : inactiveLinkClass}`}
          >
            Consult
          </Link>
          
          <Link
            href="/pharmacy"
            className={`${linkBaseClass} ${isActive('/pharmacy') ? activeLinkClass : inactiveLinkClass}`}
          >
            Pharmacy
          </Link>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 transition-colors"
            title="Refresh data"
          >
            <RefreshCw
            className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <LocationDropdown />
        </div>
      </div>
    </nav>
  );
}