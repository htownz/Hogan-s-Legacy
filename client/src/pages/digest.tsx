import { useState } from 'react';
import { Link } from 'wouter';
import { useUser } from '../context/UserContext';
import { Bookmark, Calendar, Check, ChevronRight, Clock, Download, Share2 } from 'lucide-react';
import NotificationBanner from '../components/user/NotificationBanner';
import ShareDialog from '../components/legislation/ShareDialog';
import { format } from 'date-fns';

export default function DigestPage() {
  const { userData } = useUser();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  
  // Sort bills by status update date (newest first)
  const sortedBillStatuses = userData.trackedBillStatuses ? [...userData.trackedBillStatuses].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  ) : [];
  
  // Sort reminders by date (upcoming first)
  const sortedReminders = userData.reminders ? [...userData.reminders].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  ) : [];
  
  // Filter for incomplete reminders only
  const upcomingReminders = sortedReminders.filter(r => !r.completed);
  
  // Filter for completed reminders
  const completedReminders = sortedReminders.filter(r => r.completed);
  
  // Get today's date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  const isTomorrow = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate() === tomorrow.getDate() && 
           date.getMonth() === tomorrow.getMonth() && 
           date.getFullYear() === tomorrow.getFullYear();
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(dateString)) {
        return 'Today';
      } else if (isTomorrow(dateString)) {
        return 'Tomorrow';
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Handle sharing a bill
  const handleShareBill = (bill: any) => {
    setSelectedBill(bill);
    setIsShareDialogOpen(true);
  };
  
  // Simulate exporting digest
  const handleExport = () => {
    alert('This would export your digest as PDF or email it to you. Feature coming soon!');
  };
  
  return (
    <div className="min-h-screen bg-[#121421] text-white pb-12">
      {/* Notification banner for unread notifications */}
      <NotificationBanner />
      
      {/* Header */}
      <header className="bg-[#1e2334] py-6 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Weekly Digest</h1>
            <button 
              onClick={handleExport}
              className="flex items-center text-sm bg-[#2a2f40] hover:bg-[#343b52] rounded-md py-2 px-3 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
          <p className="text-gray-400 mt-1">
            Your personalized summary of legislative activity
          </p>
        </div>
      </header>
      
      <div className="container mx-auto px-4 mt-8">
        {/* Status updates section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-400" />
            Recent Bill Updates
          </h2>
          
          {sortedBillStatuses.length === 0 ? (
            <div className="bg-[#1e2334] rounded-lg p-8 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">
                You're not tracking any bills yet. Go to the dashboard to start tracking bills.
              </p>
              <Link to="/dashboard">
                <button className="mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 text-white">
                  Browse Bills
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBillStatuses.map((bill) => (
                <div key={bill.billId} className="bg-[#1e2334] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/bills/${bill.billId}`} className="text-lg font-semibold hover:text-blue-400">
                        {bill.billTitle}
                      </Link>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <span className="bg-blue-500 bg-opacity-20 text-blue-400 px-2 py-0.5 rounded-full text-xs">
                          {bill.currentStatus}
                        </span>
                        <span className="mx-2">•</span>
                        <span>Updated {formatDate(bill.lastUpdated)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleShareBill(bill)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2f40] rounded-full"
                      title="Share this bill"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Upcoming action items section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-400" />
            Action Items
          </h2>
          
          {upcomingReminders.length === 0 ? (
            <div className="bg-[#1e2334] rounded-lg p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">
                You don't have any upcoming action items. Add reminders from the bill detail pages.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReminders.map((reminder) => (
                <div key={`${reminder.billId}-${reminder.action}`} className="bg-[#1e2334] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/bills/${reminder.billId}`} className="text-lg font-semibold hover:text-blue-400">
                        {reminder.billTitle}
                      </Link>
                      <p className="text-gray-300 mt-1">{reminder.action}</p>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          isToday(reminder.date) 
                            ? 'bg-red-500 bg-opacity-20 text-red-400' 
                            : isTomorrow(reminder.date) 
                              ? 'bg-orange-500 bg-opacity-20 text-orange-400' 
                              : 'bg-green-500 bg-opacity-20 text-green-400'
                        }`}>
                          {formatDate(reminder.date)}
                        </span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          reminder.priority === 'high' 
                            ? 'bg-red-500 bg-opacity-20 text-red-400' 
                            : reminder.priority === 'medium' 
                              ? 'bg-orange-500 bg-opacity-20 text-orange-400' 
                              : 'bg-green-500 bg-opacity-20 text-green-400'
                        }`}>
                          {reminder.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                    <Link to={`/bills/${reminder.billId}`} className="text-blue-400 hover:text-blue-300">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Completed action items section */}
        {completedReminders.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Check className="h-5 w-5 mr-2 text-green-400" />
              Completed Actions
            </h2>
            
            <div className="space-y-4">
              {completedReminders.map((reminder) => (
                <div key={`${reminder.billId}-${reminder.action}-completed`} className="bg-[#1e2334] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-400" />
                        <Link to={`/bills/${reminder.billId}`} className="text-lg font-semibold hover:text-blue-400">
                          {reminder.billTitle}
                        </Link>
                      </div>
                      <p className="text-gray-300 mt-1">{reminder.action}</p>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <span>Completed on {formatDate(reminder.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* What to do this week section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Check className="h-5 w-5 mr-2 text-purple-400" />
            What to Do This Week
          </h2>
          
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2">Weekly Suggestions</h3>
            <ul className="space-y-3">
              {!userData.trackedBills || userData.trackedBills.length === 0 ? (
                <li className="flex items-start">
                  <span className="bg-white bg-opacity-10 rounded-full p-1 mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-purple-300" />
                  </span>
                  <span>Start tracking bills that matter to you - visit the Dashboard to browse legislation.</span>
                </li>
              ) : (
                <>
                  {upcomingReminders.length === 0 && (
                    <li className="flex items-start">
                      <span className="bg-white bg-opacity-10 rounded-full p-1 mr-3 mt-0.5">
                        <Check className="h-4 w-4 text-purple-300" />
                      </span>
                      <span>Create reminders for bills you're tracking to stay on top of important dates.</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="bg-white bg-opacity-10 rounded-full p-1 mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-purple-300" />
                    </span>
                    <span>Review your tracked bills to check for any recent updates.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-white bg-opacity-10 rounded-full p-1 mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-purple-300" />
                    </span>
                    <span>Share at least one bill with friends or family to spread awareness.</span>
                  </li>
                </>
              )}
              <li className="flex items-start">
                <span className="bg-white bg-opacity-10 rounded-full p-1 mr-3 mt-0.5">
                  <Check className="h-4 w-4 text-purple-300" />
                </span>
                <span>Update your interests in your profile to get more relevant bill recommendations.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-white bg-opacity-10 rounded-full p-1 mr-3 mt-0.5">
                  <Check className="h-4 w-4 text-purple-300" />
                </span>
                <span>Check back next week for a new digest of legislative updates.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
      
      {/* Share Dialog */}
      {selectedBill && isShareDialogOpen && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          billId={selectedBill.billId}
          billTitle={selectedBill.billTitle}
          summary="This is a summary of the bill." // We'd need to fetch this from API
          status={selectedBill.currentStatus}
          impactSummary="This bill may impact you based on your location and interests." // We'd need to generate this
          zipCode={userData.zipCode || ''}
          tags={userData.interests || []}
        />
      )}
    </div>
  );
}