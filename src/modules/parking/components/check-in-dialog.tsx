// components/parking/CheckInDialog.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VehicleType, BillingType } from '@/types/enums';
import { useCheckInMutation } from '@/actions/parking-actions';
import { PlusCircle, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  numberPlate: z.string().min(3, "Number plate must be at least 3 characters.").max(10),
  vehicleType: z.nativeEnum(VehicleType, {
    message: "Please select a vehicle type.",
  }),
  billingType: z.nativeEnum(BillingType, {
    message: "Please select a billing type.",
  }),
});

export function CheckInDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutate: checkIn, isPending } = useCheckInMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberPlate: "",
    },
  });

  // Clear server error when form values change
  const clearServerError = () => {
    if (serverError) {
      setServerError(null);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null); // Clear any previous server errors
    
    checkIn(values, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        setServerError(null);
      },
      onError: (error: any) => {
        // Handle different types of errors from the API
        if (error?.response?.data) {
          const errorData = error.response.data;
          
          // Handle validation errors (field-specific errors)
          if (errorData.error && typeof errorData.error === 'object' && !errorData.error.message) {
            // This is a validation error object with field-specific errors
            Object.entries(errorData.error).forEach(([field, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                form.setError(field as keyof typeof values, {
                  message: messages[0] as string
                });
              }
            });
          } else {
            // Handle general server errors (business logic errors)
            const errorMessage = errorData.error?.message || errorData.error || 'An unexpected error occurred';
            setServerError(errorMessage);
          }
        } else {
          // Handle network errors or other unexpected errors
          const errorMessage = error?.message || 'Network error. Please try again.';
          setServerError(errorMessage);
        }
      },
    });
  }

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form and clear errors when dialog closes
      form.reset();
      setServerError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          New Vehicle Check-In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vehicle Entry</DialogTitle>
          <DialogDescription>
            Enter vehicle details to assign a parking slot.
          </DialogDescription>
        </DialogHeader>
        
        {/* Display server error if exists */}
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                        clearServerError();
                      }}
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      clearServerError();
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(VehicleType).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        clearServerError();
                      }}
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
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Assigning Slot..." : "Assign Slot & Check-In"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}