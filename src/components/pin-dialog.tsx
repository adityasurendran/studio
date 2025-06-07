// src/components/pin-dialog.tsx
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, ShieldQuestion, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PinDialogProps {
  mode: 'setup' | 'enter';
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSuccess: (pinValue?: string) => void; // pinValue is provided in 'setup' mode
  title: string;
  description?: string;
}

export default function PinDialog({ mode, isOpen, setIsOpen, onSuccess, title, description }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when dialog opens or mode changes
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setError(null);
    }
  }, [isOpen, mode]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow only digits
    if (value.length <= 4) {
      setPin(value);
      setError(null);
    }
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow only digits
    if (value.length <= 4) {
      setConfirmPin(value);
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits long.");
      return;
    }

    if (mode === 'setup') {
      if (confirmPin.length !== 4) {
        setError("Please confirm your 4-digit PIN.");
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match.");
        return;
      }
      onSuccess(pin);
      toast({ title: "PIN Setup Successful", description: "Your PIN has been set." });
    } else { // mode === 'enter'
      onSuccess(pin); // The calling component will verify the pin
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {mode === 'setup' ? <ShieldQuestion className="h-7 w-7 text-primary" /> : <KeyRound className="h-7 w-7 text-primary" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-base">
              {mode === 'setup' ? 'Create 4-Digit PIN' : 'Enter 4-Digit PIN'}
            </Label>
            <Input
              id="pin"
              type="password" // Use password type to hide digits
              value={pin}
              onChange={handlePinChange}
              maxLength={4}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em] h-14"
              aria-label={mode === 'setup' ? 'Create 4-Digit PIN' : 'Enter 4-Digit PIN'}
            />
          </div>
          {mode === 'setup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPin" className="text-base">Confirm 4-Digit PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                value={confirmPin}
                onChange={handleConfirmPinChange}
                maxLength={4}
                placeholder="••••"
                className="text-center text-2xl tracking-[0.5em] h-14"
                aria-label="Confirm 4-Digit PIN"
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {mode === 'setup' ? 'Set PIN' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
