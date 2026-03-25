import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillReminder, useUser, markReminderComplete, removeReminder } from "@/context/UserContext";
import { Check, Trash2, Calendar, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function RemindersPanel() {
  const { userData, setUserData } = useUser();
  const [expandedReminder, setExpandedReminder] = useState<string | null>(null);

  // Sort reminders by date (most urgent first) and then by priority
  const sortedReminders = [...userData.reminders].sort((a, b) => {
    // First sort by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then sort by date
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Finally sort by priority
    const priorityValue = { high: 3, medium: 2, low: 1 };
    return priorityValue[b.priority] - priorityValue[a.priority];
  });

  // Group reminders by bill
  const remindersByBill: Record<string, BillReminder[]> = {};
  sortedReminders.forEach(reminder => {
    if (!remindersByBill[reminder.billId]) {
      remindersByBill[reminder.billId] = [];
    }
    remindersByBill[reminder.billId].push(reminder);
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600";
      case "medium":
        return "bg-orange-500 hover:bg-orange-600";
      case "low":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Calculate days until the date
    const daysUntil = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return "Overdue";
    } else if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    } else if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return "Tomorrow";
    } else if (daysUntil < 7) {
      return `${daysUntil} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle checkbox toggle (completing a reminder)
  const handleToggleComplete = (reminder: BillReminder) => {
    if (reminder.completed) {
      // If already completed, do nothing
      return;
    }
    
    markReminderComplete(setUserData, reminder.billId, reminder.action);
  };

  // Handle removing a reminder
  const handleRemoveReminder = (billId: string, action: string) => {
    removeReminder(setUserData, billId, action);
  };

  // Toggle expanded view for a bill's reminders
  const toggleExpandedReminder = (billId: string) => {
    if (expandedReminder === billId) {
      setExpandedReminder(null);
    } else {
      setExpandedReminder(billId);
    }
  };

  return (
    <Card className="bg-[#1e2334] border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-white flex justify-between items-center">
          <span>Action Reminders</span>
          <Badge variant="outline" className="ml-2 bg-[#f05a28] text-white border-transparent">
            {sortedReminders.filter(r => !r.completed).length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(remindersByBill).length === 0 ? (
          <div className="text-center p-4 text-gray-400">
            <p>No reminders set</p>
            <p className="text-sm mt-2">Track bills to get recommended actions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(remindersByBill).map(([billId, reminders]) => (
              <Card 
                key={billId} 
                className={cn(
                  "border-gray-700 bg-[#121825] transition-all overflow-hidden",
                  expandedReminder === billId ? "shadow-lg" : "hover:shadow-md"
                )}
                onClick={() => toggleExpandedReminder(billId)}
              >
                {/* Bill header with toggle expanded functionality */}
                <div className="p-4 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">{reminders[0].billTitle}</h3>
                      <p className="text-sm text-gray-400">{billId}</p>
                    </div>
                    <Badge className="text-xs">
                      {reminders.filter(r => !r.completed).length} action{reminders.filter(r => !r.completed).length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Individual reminders for this bill */}
                {expandedReminder === billId && (
                  <div className="border-t border-gray-700 divide-y divide-gray-700">
                    {reminders.map((reminder, index) => (
                      <div 
                        key={`${reminder.billId}-${reminder.action}-${index}`}
                        className={cn(
                          "p-3 flex items-start gap-3",
                          reminder.completed ? "bg-opacity-10 bg-gray-500" : ""
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Checkbox to mark completed */}
                        <button
                          className={cn(
                            "mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0",
                            reminder.completed 
                              ? "bg-green-600 border-green-600 text-white" 
                              : "border-gray-500 hover:border-gray-400"
                          )}
                          onClick={() => handleToggleComplete(reminder)}
                        >
                          {reminder.completed && <Check className="w-3 h-3" />}
                        </button>
                        
                        {/* Reminder content */}
                        <div className={cn(
                          "flex-1", 
                          reminder.completed ? "text-gray-500 line-through" : ""
                        )}>
                          <div className="flex items-center gap-1 mb-1">
                            {reminder.priority === "high" && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <p className="font-medium text-sm">{reminder.action}</p>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-400 gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(reminder.date)}
                            </span>
                            
                            <Badge 
                              className={cn(
                                "text-white text-xs py-0 px-2 h-4", 
                                getPriorityColor(reminder.priority)
                              )}
                            >
                              {reminder.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          className="text-gray-500 hover:text-red-500 transition-colors"
                          onClick={() => handleRemoveReminder(reminder.billId, reminder.action)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        
        {sortedReminders.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 
                Upcoming
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> 
                Completed: {sortedReminders.filter(r => r.completed).length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}