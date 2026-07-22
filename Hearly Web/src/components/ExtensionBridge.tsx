import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export interface ExtensionProfile {
  embedding?: number[];
  embeddingModel?: string;
}

export const ExtensionBridge: React.FC<{
  onStatusChange?: (connected: boolean) => void;
}> = ({ onStatusChange }) => {
  const [extensionDetected, setExtensionDetected] = useState<boolean>(false);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'HEARLY_EXTENSION_CONNECTED') {
        setExtensionDetected(true);
        setVersion(event.data.version || '1.0.0');
        onStatusChange?.(true);
      }
    };

    window.addEventListener('message', handleMessage);

    // Dispatch check request to content script
    window.postMessage({
      source: 'hearly-web-page',
      type: 'HEARLY_WEB_CHECK_EXTENSION',
    }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, [onStatusChange]);

  if (!extensionDetected) {
    return (
      <div className="w-full bg-accent/10 border-y border-accent/20 px-6 py-2.5 text-center text-xs font-semibold text-accent flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Connect your Hearly Chrome Extension to sync meeting history and voice profiles.</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-accent/15 border-y border-accent/30 px-6 py-2.5 text-center text-xs font-bold text-accent flex items-center justify-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-accent" />
      <span>Hearly Chrome Extension v{version} Active & Connected to Web App!</span>
    </div>
  );
};
