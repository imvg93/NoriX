"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import SocketStatus with proper client-side configuration
const SocketStatus = dynamic(() => import("./SocketStatus"), {
  ssr: false,
  loading: () => null
});

interface ClientSocketStatusProps {
  showDetails?: boolean;
  className?: string;
}

const ClientSocketStatus: React.FC<ClientSocketStatusProps> = (props) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server side
  if (!isClient) {
    return null;
  }

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <SocketStatus {...props} />;
};

export default ClientSocketStatus;
