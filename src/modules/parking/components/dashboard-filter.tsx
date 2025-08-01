// components/parking/DashboardFilters.tsx
"use client";

import { Search, Car } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleType } from "@/types/enums";

interface DashboardFiltersProps {
  onFilterChange: (filters: { vehicleType?: VehicleType | 'ALL'; numberPlate?: string }) => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
      <div className="relative w-full md:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Number Plate..."
          className="pl-10"
          onChange={(e) => onFilterChange({ numberPlate: e.target.value })}
        />
      </div>
      <div className="w-full md:w-auto md:min-w-[200px]">
        <Select onValueChange={(value) => onFilterChange({ vehicleType: value as VehicleType | 'ALL' })}>
          <SelectTrigger>
            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by Vehicle Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Vehicle Types</SelectItem>
            {Object.values(VehicleType).map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}