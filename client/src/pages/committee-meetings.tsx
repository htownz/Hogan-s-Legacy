import CommitteeMeetingList from "@/components/committees/CommitteeMeetingList";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function CommitteeMeetingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <Link 
            href="/legislation" 
            className="text-muted-foreground hover:text-foreground flex items-center mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Legislation
          </Link>
          
          <h1 className="text-3xl font-bold">Committee Meetings</h1>
          <p className="text-muted-foreground mt-2">
            Find and track committee meetings for Texas legislation.
          </p>
        </div>
        
        <CommitteeMeetingList />
      </div>
    </div>
  );
}