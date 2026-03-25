import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useBillNotes, 
  useUserBillNotes, 
  useCreateBillNote, 
  useUpdateBillNote, 
  useDeleteBillNote 
} from "@/hooks/use-bill-interactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Edit, 
  Trash2, 
  Globe, 
  Lock, 
  MessageSquarePlus, 
  Check, 
  X, 
  AlertCircle,
  User as UserIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BillNote } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface BillNotesProps {
  billId: string;
}

export function BillNotes({ billId }: BillNotesProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("my-notes");
  const [newNote, setNewNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  
  const { data: publicNotes = [], isLoading: isLoadingPublicNotes } = useBillNotes(billId);
  const { data: userNotes = [], isLoading: isLoadingUserNotes } = useUserBillNotes(billId);
  
  const createNoteMutation = useCreateBillNote(billId);
  
  const handleCreateNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await createNoteMutation.mutateAsync({
        userId: user?.id || 0,
        content: newNote.trim(),
        isPrivate
      });
      
      setNewNote("");
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  if (!user) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Bill Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">
              Please sign in to view and create notes for this bill.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const isLoading = isLoadingPublicNotes || isLoadingUserNotes;
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Bill Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="my-notes" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="my-notes">My Notes</TabsTrigger>
            <TabsTrigger value="public-notes">Public Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-notes">
            <div className="mb-4">
              <Textarea
                placeholder="Add a new note about this bill..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="mb-2"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="note-privacy" 
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="note-privacy" className="cursor-pointer">
                    {isPrivate ? 
                      <span className="flex items-center"><Lock className="h-4 w-4 mr-1" /> Private</span> : 
                      <span className="flex items-center"><Globe className="h-4 w-4 mr-1" /> Public</span>
                    }
                  </Label>
                </div>
                <Button
                  onClick={handleCreateNote}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="bg-muted rounded-md h-24" />
                ))}
              </div>
            ) : userNotes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>You haven't created any notes for this bill yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userNotes.map((note: any) => (
                  <NoteItem 
                    key={note.id} 
                    note={note} 
                    isUserNote={true}
                    billId={billId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="public-notes">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-muted rounded-md h-24" />
                ))}
              </div>
            ) : publicNotes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>There are no public notes for this bill yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {publicNotes.map((note: any) => (
                  <NoteItem 
                    key={note.id} 
                    note={note} 
                    isUserNote={note.userId === user?.id}
                    billId={billId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface NoteItemProps {
  note: BillNote;
  isUserNote: boolean;
  billId: string;
}

function NoteItem({ note, isUserNote, billId }: NoteItemProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [editedIsPrivate, setEditedIsPrivate] = useState(note.isPrivate);
  
  const updateNoteMutation = useUpdateBillNote(billId);
  const deleteNoteMutation = useDeleteBillNote(billId);
  
  const handleUpdateNote = async () => {
    if (!editedContent.trim()) {
      toast({
        title: "Note cannot be empty",
        description: "Please enter content for your note or delete it instead.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateNoteMutation.mutateAsync({
        noteId: note.id,
        data: {
          content: editedContent.trim(),
          isPrivate: editedIsPrivate
        }
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };
  
  const handleDeleteNote = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNoteMutation.mutateAsync(note.id);
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    }
  };
  
  // Format date to "X time ago" format
  const formattedDate = note.createdAt 
    ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
    : "";
  
  return (
    <Card className="shadow-sm border-muted">
      <CardContent className="pt-4">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
              className="mb-2"
            />
            <div className="flex items-center space-x-2">
              <Switch 
                id={`edit-privacy-${note.id}`} 
                checked={editedIsPrivate}
                onCheckedChange={setEditedIsPrivate}
              />
              <Label htmlFor={`edit-privacy-${note.id}`} className="cursor-pointer">
                {editedIsPrivate ? 
                  <span className="flex items-center"><Lock className="h-4 w-4 mr-1" /> Private</span> : 
                  <span className="flex items-center"><Globe className="h-4 w-4 mr-1" /> Public</span>
                }
              </Label>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{note.content}</p>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                {isUserNote ? (
                  <UserIcon className="h-3 w-3 mr-1" />
                ) : (
                  <UserIcon className="h-3 w-3 mr-1" />
                )}
                <span>{isUserNote ? "You" : "Anonymous User"}</span>
              </div>
              <span className="mx-2">•</span>
              <span>{formattedDate}</span>
              {note.isPrivate && (
                <>
                  <span className="mx-2">•</span>
                  <Lock className="h-3 w-3 mr-1" />
                  <span>Private</span>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
      {isUserNote && (
        <CardFooter className="flex justify-end gap-2 pt-0 pb-3">
          {isEditing ? (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpdateNote}
                disabled={updateNoteMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={handleDeleteNote}
                disabled={deleteNoteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}