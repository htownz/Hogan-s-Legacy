import { useState } from 'react';
import { useNotifications, NotificationType, UserNotificationPreference } from '@/contexts/notification-context';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Volume2, Mail, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface NotificationSettingsProps {
  trigger?: React.ReactNode;
  className?: string;
}

export default function NotificationSettings({ trigger, className }: NotificationSettingsProps) {
  const [open, setOpen] = useState(false);
  
  const {
    notificationTypes,
    notificationPreferences,
    updatePreference,
    isLoading
  } = useNotifications();
  
  // Get the combined notification preferences with type information
  const combinedPreferences = notificationPreferences.map(preference => {
    const notificationType = notificationTypes.find(type => type.id === preference.notificationTypeId);
    return {
      ...preference,
      typeName: notificationType?.name || 'Unknown',
      typeDescription: notificationType?.description || '',
      defaultPriority: notificationType?.defaultPriority || 3,
      iconName: notificationType?.iconName || 'bell',
      typeColor: notificationType?.color || '#6B7280'
    };
  }).sort((a, b) => a.priority - b.priority);
  
  // Loading state for preferences
  const renderLoadingState = () => (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex flex-col space-y-2 px-1">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
  
  // Handle preference toggle
  const handleTogglePreference = (preferenceId: number, enabled: boolean) => {
    updatePreference(preferenceId, { enabled });
  };
  
  // Handle priority change
  const handlePriorityChange = (preferenceId: number, priority: string) => {
    updatePreference(preferenceId, { priority: parseInt(priority) });
  };
  
  // Handle delivery methods toggle
  const handleDeliveryMethodToggle = (
    preferenceId: number, 
    method: 'pushEnabled' | 'emailEnabled' | 'inAppEnabled',
    value: boolean
  ) => {
    updatePreference(preferenceId, { [method]: value });
  };
  
  const priorityLabels = {
    1: { label: 'Urgent', color: 'text-red-500' },
    2: { label: 'High', color: 'text-orange-500' },
    3: { label: 'Medium', color: 'text-blue-500' },
    4: { label: 'Low', color: 'text-green-500' },
    5: { label: 'Info', color: 'text-gray-500' }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <Settings className="mr-2 h-4 w-4" />
            Notification Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Customize which notifications you receive and how they're delivered
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          renderLoadingState()
        ) : (
          <div className="mt-4">
            <Accordion type="multiple" className="w-full">
              {combinedPreferences.map((preference) => (
                <AccordionItem 
                  key={preference.id} 
                  value={preference.id.toString()}
                  className={cn(
                    "border rounded-md mb-3 overflow-hidden",
                    !preference.enabled && "opacity-75"
                  )}
                >
                  <div className="flex flex-col">
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: `${preference.typeColor}20` }}
                          >
                            <Bell 
                              className="h-5 w-5" 
                              style={{ color: preference.typeColor }} 
                            />
                          </div>
                          <div>
                            <h3 className="font-medium flex items-center">
                              {preference.typeName.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                              
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "ml-2 px-1.5 py-0 text-xs",
                                  priorityLabels[preference.priority as keyof typeof priorityLabels]?.color
                                )}
                              >
                                {priorityLabels[preference.priority as keyof typeof priorityLabels]?.label || 'Medium'}
                              </Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground">{preference.typeDescription}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preference.enabled}
                          onCheckedChange={(checked) => handleTogglePreference(preference.id, checked)}
                          aria-label={`Toggle ${preference.typeName} notifications`}
                        />
                      </div>
                    </div>
                    
                    <AccordionTrigger className="h-8 px-4 py-0 hover:no-underline">
                      <span className="text-xs">Notification settings</span>
                    </AccordionTrigger>
                    
                    <AccordionContent className="pb-4 pt-2">
                      <div className="px-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`priority-${preference.id}`}>Priority Level</Label>
                            <Select
                              disabled={!preference.enabled}
                              value={preference.priority.toString()}
                              onValueChange={(value) => handlePriorityChange(preference.id, value)}
                            >
                              <SelectTrigger id={`priority-${preference.id}`}>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="1">Urgent (Highest)</SelectItem>
                                  <SelectItem value="2">High</SelectItem>
                                  <SelectItem value="3">Medium</SelectItem>
                                  <SelectItem value="4">Low</SelectItem>
                                  <SelectItem value="5">Info (Lowest)</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-3">
                            <Label className="block mb-1">Delivery Methods</Label>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">App Notifications</span>
                              </div>
                              <Switch 
                                checked={preference.inAppEnabled}
                                disabled={!preference.enabled}
                                onCheckedChange={(checked) => 
                                  handleDeliveryMethodToggle(preference.id, 'inAppEnabled', checked)
                                }
                                aria-label={`Toggle in-app notifications for ${preference.typeName}`}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Volume2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Push Notifications</span>
                              </div>
                              <Switch 
                                checked={preference.pushEnabled}
                                disabled={!preference.enabled}
                                onCheckedChange={(checked) => 
                                  handleDeliveryMethodToggle(preference.id, 'pushEnabled', checked)
                                }
                                aria-label={`Toggle push notifications for ${preference.typeName}`}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Email Notifications</span>
                              </div>
                              <Switch 
                                checked={preference.emailEnabled}
                                disabled={!preference.enabled}
                                onCheckedChange={(checked) => 
                                  handleDeliveryMethodToggle(preference.id, 'emailEnabled', checked)
                                }
                                aria-label={`Toggle email notifications for ${preference.typeName}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
            
            {combinedPreferences.length === 0 && (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No notification preferences found</p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}