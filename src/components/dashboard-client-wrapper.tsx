"use client";

import React, { useState, useEffect } from "react";
import { OnboardingModal } from "@/components/onboarding-modal";


interface DashboardClientWrapperProps {
  children: React.ReactNode;
  userEmail: string;
  userFullName?: string;
  userTimezone?: string;
}

export function DashboardClientWrapper({
  children,
  userEmail,
  userFullName = "",
  userTimezone = "UTC",
}: DashboardClientWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isClient, setIsClient] = useState(false);

    useEffect(() => {
    setIsClient(true);
    
    // Check if onboarding has been completed
    const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    
    // Determine if we should show onboarding
    const shouldShowOnboarding = !onboardingCompleted && (
      !userFullName || 
      userFullName === 'Unknown User' || 
      userFullName === 'Unknown' ||
      !userTimezone || 
      userTimezone === 'UTC'
    );

    if (shouldShowOnboarding) {
      setShowOnboarding(true);
    }
  }, [userFullName, userTimezone]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Don't reload the page, just close the modal
    // The dashboard content will remain visible underneath
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return <div>{children}</div>;
  }

  return (
    <>
      {children}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        initialEmail={userEmail}
        initialFullName={userFullName}
        initialTimezone={userTimezone}
      />
    </>
  );
}
