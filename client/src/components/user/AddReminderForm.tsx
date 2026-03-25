import { useState } from "react";
import { useForm } from "react-hook-form";
import { addReminder, useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AddReminderFormProps {
  billId: string;
  billTitle: string;
  suggestedAction?: string;
}

type FormValues = {
  action: string;
  date: Date;
  priority: "low" | "medium" | "high";
};

export function AddReminderForm({ billId, billTitle, suggestedAction }: AddReminderFormProps) {
  const { setUserData } = useUser();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  
  const { register, handleSubmit, formState, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      action: suggestedAction || "",
      priority: "medium",
    },
  });

  const onSubmit = (data: FormValues) => {
    addReminder(setUserData, {
      billId,
      billTitle,
      action: data.action,
      date: date.toISOString(),
      completed: false,
      priority: data.priority,
    });
    
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 font-medium text-white bg-[#1e2334] border-gray-700 hover:bg-[#283049]"
        >
          <PlusCircle className="h-4 w-4" />
          Add Reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e2334] border-gray-700 text-white sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set a reminder for actions related to {billTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="action" className="text-white">Action</Label>
              <Input
                id="action"
                className="bg-[#121825] border-gray-700 text-white"
                placeholder="What do you need to do?"
                {...register("action", { required: true })}
              />
              {formState.errors.action && (
                <p className="text-red-500 text-xs mt-1">This field is required</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-white">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-[#121825] border-gray-700 text-white hover:bg-[#1b243a]",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1e2334] border-gray-700">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="bg-[#1e2334]"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label className="text-white">Priority</Label>
              <RadioGroup 
                defaultValue="medium"
                onValueChange={(value) => setValue("priority", value as "low" | "medium" | "high")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" className="border-blue-500 text-blue-500" />
                  <Label htmlFor="low" className="text-gray-300">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" className="border-orange-500 text-orange-500" />
                  <Label htmlFor="medium" className="text-gray-300">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" className="border-red-500 text-red-500" />
                  <Label htmlFor="high" className="text-gray-300">High</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="bg-transparent text-white border-gray-700 hover:bg-[#283049]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#f05a28] hover:bg-[#e04a18] text-white"
            >
              Save Reminder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}