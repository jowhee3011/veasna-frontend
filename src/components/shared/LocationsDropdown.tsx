"use client"

import { useEffect, useState } from "react"
import { useLocationStore } from "@/stores/useLocationStore"
import { Location } from "@/lib/types/location"
import { getLocations } from "@/lib/api/location/getLocations"

// Add on or remove accordingly
const defaultLocations: Location[] = [
  { id: 1, name: "Loc A" },
  { id: 2, name: "Loc B" },
  { id: 3, name: "Loc C" },
]

export default function LocationsDropdown() {
  const [locations, setLocations] = useState<Location[]>([])
  const [options, setOptions] = useState<string[]>([])

  const location = useLocationStore((state) => state.location)
  const setLocation = useLocationStore((state) => state.setLocation)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    const selectedLocation = locations.find(loc => loc.name === selected)!;
    setLocation(selectedLocation)
  }

  useEffect(() => {
    async function fetchLocations() {
      try {
        const locationsData = await getLocations();
        if (locationsData.length === 0) {
          setLocations(defaultLocations);
        } else {
          setLocations(locationsData);
        }
      } catch (err) {
        console.error(err);
        setLocations(defaultLocations);
      }
    }

    fetchLocations();
  }, []);

  useEffect(() => {
    const parsedLocations = locations.map((loc) => loc.name)
    setOptions(parsedLocations)
  }, [locations])

  return (
    <select
      id="locations"
      name="locations"
      value={location?.name || ""}
      onChange={handleChange}
      className="px-2 outline-none appearance-none hover:cursor-pointer"
    >
      <option value="" disabled>
        -- Select a location --
      </option>
      {options.map((location_name) => (
        <option key={location_name} value={location_name}>
          {location_name}
        </option>
      ))}
    </select>
  )
}
