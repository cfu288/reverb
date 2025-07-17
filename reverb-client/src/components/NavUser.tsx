import { useState, useEffect } from "react"
import {
  LogOut,
  MoreVertical,
  UserCircle,
  Building2,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useTenantSwitcher } from "@/contexts/TenantSwitcherContext"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout, currentTenant, tenants } = useAuth()
  const navigate = useNavigate()
  const { openTenantSwitcher } = useTenantSwitcher()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Close dropdown when sidebar state changes to prevent aria-hidden conflicts
  useEffect(() => {
    setDropdownOpen(false)
  }, [isMobile])

  if (!user) return null

  // Get initials from name or email
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.name) {
      const names = user.name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  const displayName = user.name || `${user.firstName} ${user.lastName}`.trim() || user.username

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => {
                setDropdownOpen(false)
                navigate('/account')
              }}>
                <UserCircle className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setDropdownOpen(false)
                openTenantSwitcher()
              }}>
                <Building2 className="mr-2 h-4 w-4" />
                Switch Organization
                {currentTenant ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {currentTenant.displayName}
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tenants?.length || 0} orgs
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false)
              logout()
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    </>
  )
}