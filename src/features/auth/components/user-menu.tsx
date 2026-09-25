import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAccountDialog } from '@/components/account-dialog'
import { Avatar } from '@/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { m } from '@/paraglide/messages'
import { authClient } from '../client'

interface UserMenuProps {
  user: {
    name: string
    email: string
    role?: string | null
    image?: string | null
  }
  /** Collapsed rail shows just the avatar. */
  collapsed?: boolean
  /** Extra items from other features (e.g. Help & feedback), placed above
   * sign-out. Passed in by the shell — auth never imports another feature. */
  items?: ReactNode
}

export function UserMenu({ user, collapsed = false, items }: UserMenuProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const openAccount = useAccountDialog()

  async function handleLogout() {
    await authClient.signOut()
    await queryClient.invalidateQueries({ queryKey: ['session'] })
    navigate({ to: '/' })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center rounded-full text-sm transition-colors hover:bg-background ${collapsed ? 'size-8 justify-center self-center' : 'w-full gap-2 p-1 pr-3'}`}
        >
          <Avatar
            name={user.name}
            image={user.image}
            className="size-7 shrink-0 text-xs"
          />
          {!collapsed && <span className="truncate">{user.name}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {openAccount && (
          <DropdownMenuItem onClick={() => openAccount('account')}>
            {m.app_settings_title()}
          </DropdownMenuItem>
        )}
        {items}
        <DropdownMenuItem onClick={handleLogout}>
          {m.auth_logout()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
