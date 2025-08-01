// components/parking/CheckInDialog.tsx
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { VehicleType, BillingType, SlotStatus } from "@/types/enums";
import { useCheckInMutation } from "@/actions/parking-actions";
import { useAllSlotsQuery } from "@/actions/slot-actions";
import { PlusCircle } from "lucide-react";

// --- Corrected Zod Schema ---
const formSchema = z
  .object({
    numberPlate: z.string().min(3, "Number plate is required.").max(10),
    vehicleType: z.nativeEnum(VehicleType).refine(val => !!val, {
      message: 'Please select a vehicle type.',
    }),
    billingType: z.nativeEnum(BillingType).refine(val => !!val, {
      message: 'Please select a billing type.',
    }),
    isManualAssignment: z.boolean(),
    slotId: z.string().optional(),
  })
  .refine(
    (data) => {
      return (
        !data.isManualAssignment || (data.isManualAssignment && !!data.slotId)
      );
    },
    {
      message: "Please select a slot for manual assignment.",
      path: ["slotId"],
    }
  );

export function CheckInDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: checkIn, isPending } = useCheckInMutation();
  const { data: allSlots, isLoading: isLoadingSlots } = useAllSlotsQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberPlate: "",
      isManualAssignment: false,
    },
  });

  const isManual = form.watch("isManualAssignment");

  const availableSlots = useMemo(() => {
    if (!allSlots) return [];
    return allSlots.filter((slot) => slot.status === SlotStatus.AVAILABLE);
  }, [allSlots]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    checkIn(values, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" /> New Vehicle Check-In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vehicle Entry</DialogTitle>
          <DialogDescription>
            Enter vehicle details to assign a parking slot.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="numberPlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number Plate</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., TN07CQ0000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(VehicleType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Billing Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-6"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={BillingType.HOURLY} />
                        </FormControl>
                        <FormLabel className="font-normal">Hourly</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={BillingType.DAY_PASS} />
                        </FormControl>
                        <FormLabel className="font-normal">Day Pass</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isManualAssignment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Manual Slot Assignment</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isManual && (
              <FormField
                control={form.control}
                name="slotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Available Slot</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isLoadingSlots}>
                          <SelectValue
                            placeholder={
                              isLoadingSlots
                                ? "Loading slots..."
                                : "Choose a slot"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <SelectItem key={slot._id} value={slot._id}>
                              {slot.slotNumber} ({slot.slotType})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No slots available.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Assigning..." : "Assign Slot & Check-In"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}