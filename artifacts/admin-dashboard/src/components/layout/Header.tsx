import React from 'react';
import { User } from '@workspace/api-client-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header({ user }: { user: User }) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0 shadow-sm">
      <div className="font-semibold text-lg text-foreground flex items-center gap-2">
        {/* We can show breadcrumbs or page title here based on route later */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-end hidden sm:block">
            <p className="text-sm font-medium leading-none text-foreground">{user.fullName}</p>
            <p className="text-xs text-muted-foreground mt-1">مدير النظام</p>
          </div>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user.avatarUrl || ''} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.fullName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
