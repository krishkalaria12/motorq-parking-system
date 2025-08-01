// components/parking/AddSlotsDialog.tsx
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddSlotsMutation } from '@/actions/slot-actions';
import { SlotType } from '@/types/enums';
import { PlusCircle, Trash2 } from 'lucide-react';

// Zod schema for a single slot row
const slotSchema = z.object({
  floor: z.string().min(1, "Floor is required."),
  slotNumber: z.string().regex(/^[A-Z0-9]+[-][A-Z0-9]+$/, "Use format: FLOOR-NUMBER (e.g., B1-12)"),
  slotType: z.nativeEnum(SlotType, { message: "Select a type." }),
});

// Zod schema for the entire form
const formSchema = z.object({
  slots: z.array(slotSchema).min(1, "You must add at least one slot."),
});

export function AddSlotsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: addSlots, isPending } = useAddSlotsMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slots: [{ floor: "G", slotNumber: "G-", slotType: SlotType.REGULAR }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "slots",
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addSlots(values, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add New Slots</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Parking Slots</DialogTitle>
          <DialogDescription>
            Add one or more slots to the parking system. Use the button to add more rows.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-2 border rounded-md">
                  <FormField control={form.control} name={`slots.${index}.floor`} render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>Floor</FormLabel>
                      <FormControl><Input placeholder="e.g., B1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`slots.${index}.slotNumber`} render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>Slot Number</FormLabel>
                      <FormControl><Input placeholder="e.g., B1-12" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`slots.${index}.slotType`} render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{Object.values(SlotType).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="col-span-1 flex items-center h-full pt-8">
                    {fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => append({ floor: "G", slotNumber: "G-", slotType: SlotType.REGULAR })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Slot
            </Button>
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating Slots..." : `Create ${fields.length} Slot(s)`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}