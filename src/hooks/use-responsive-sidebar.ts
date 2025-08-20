import { useState, useEffect } from 'react';

export function useResponsiveSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // If mobile, ensure sidebar is closed
      if (mobile && isOpen) {
        setIsOpen(false);
      }
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isOpen]);

  const setOpen = (open: boolean) => {
    // On mobile, only allow opening if explicitly requested
    if (isMobile && open) {
      setIsOpen(true);
    } else if (isMobile && !open) {
      setIsOpen(false);
    } else {
      // Desktop behavior
      setIsOpen(open);
    }
  };

  const toggleSidebar = () => {
    setOpen(!isOpen);
  };

  return {
    state: isOpen ? "expanded" : "collapsed",
    open: isOpen,
    setOpen,
    toggleSidebar,
    isMobile
  };
}
