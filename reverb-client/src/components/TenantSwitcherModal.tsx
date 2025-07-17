import { Building2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface TenantSwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantSwitcherModal({ open, onOpenChange }: TenantSwitcherModalProps) {
  const { currentTenant, tenants, switchTenant } = useAuth();

  const handleSwitchTenant = (tenant: typeof tenants[0]) => {
    switchTenant(tenant);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch Organization</DialogTitle>
          <DialogDescription>
            Select an organization to switch your current context.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {tenants && tenants.length > 0 ? (
            tenants.map((tenant) => (
            <Button
              key={tenant.id}
              variant={tenant.id === currentTenant?.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleSwitchTenant(tenant)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    {tenant.logoUrl ? (
                      <img
                        src={tenant.logoUrl}
                        alt={tenant.displayName}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{tenant.displayName}</p>
                    <p className="text-sm text-muted-foreground">{tenant.urlSafeName}</p>
                  </div>
                </div>
                {tenant.id === currentTenant?.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </Button>
          ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No organizations available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}