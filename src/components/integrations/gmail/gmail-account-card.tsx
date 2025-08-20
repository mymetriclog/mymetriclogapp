"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Clock, MessageSquare } from "lucide-react";

type GmailAccount = {
  email: string;
  name: string;
  totalEmails: number;
  unreadCount: number;
  lastSync: string;
};

interface GmailAccountCardProps {
  connected: boolean;
  initialAccount?: GmailAccount;
}

export function GmailAccountCard({
  connected,
  initialAccount,
}: GmailAccountCardProps) {
  if (!connected || !initialAccount) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          Account Information
        </CardTitle>
        <CardDescription>
          Your Gmail account details and sync status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-800">Email Address:</span>
            <span className="text-sm font-mono text-blue-700">
              {initialAccount.email}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-800">Account Name:</span>
            <span className="text-sm font-medium text-green-700">
              {initialAccount.name}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
            <span className="text-sm font-medium text-purple-800">Total Emails:</span>
            <span className="text-sm font-bold text-purple-700">
              {initialAccount.totalEmails.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
            <span className="text-sm font-medium text-red-800">Unread Count:</span>
            <Badge variant="secondary" className="bg-red-100 text-red-700 font-bold">
              {initialAccount.unreadCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
            <span className="text-sm font-medium text-orange-800">Last Sync:</span>
            <span className="text-sm font-mono text-orange-700">
              {initialAccount.lastSync ? 
                new Date(initialAccount.lastSync).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }) : '—'
              }
            </span>
          </div>
        </div>

        {/* Account Status Summary */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Account Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Email Volume:</span>
              <span className={`font-medium ${
                initialAccount.totalEmails > 1000 ? 'text-green-600' : 
                initialAccount.totalEmails > 500 ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {initialAccount.totalEmails > 1000 ? 'High' : 
                 initialAccount.totalEmails > 500 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Unread Ratio:</span>
              <span className={`font-medium ${
                (initialAccount.unreadCount / initialAccount.totalEmails) > 0.1 ? 'text-red-600' : 
                (initialAccount.unreadCount / initialAccount.totalEmails) > 0.05 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {((initialAccount.unreadCount / initialAccount.totalEmails) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sync Status:</span>
              <span className="font-medium text-green-600">✅ Active</span>
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare className="mr-2 size-4" />
            View Recent Emails
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Calendar className="mr-2 size-4" />
            Calendar Integration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
