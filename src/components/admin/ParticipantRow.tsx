import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ParticipantRow = ({ participant }: { participant: any }) => {
  const username = typeof participant === 'string' ? participant : (participant.username || participant.name || 'Unknown');
  const email = typeof participant === 'object' ? (participant.email || '') : '';

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
      <Avatar className="w-8 h-8">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} />
        <AvatarFallback>
          {username[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{username}</p>
        {email && (
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        )}
      </div>
    </div>
  );
};
