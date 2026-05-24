'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SessionClientProps {
  roomName: string;
  userName: string;
  userEmail: string;
  role: 'patient' | 'psychiatrist';
}

export default function SessionClient({ roomName, userName, userEmail, role }: SessionClientProps) {
  const router = useRouter();

  return (
    <div className="w-full h-screen bg-neutral-950 flex flex-col">
      <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <h1 className="text-white font-bold text-sm tracking-wider uppercase">MindOrbit Live Session</h1>
        </div>
        <div className="text-xs font-semibold text-neutral-400 bg-neutral-800 px-3 py-1.5 rounded-full">
          Joined as: <span className="text-white">{userName}</span>
        </div>
      </div>

      <div className="flex-grow">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          }}
          userInfo={{
            displayName: userName,
            email: userEmail,
          }}
          onApiReady={(externalApi) => {
            // Listen for meeting end to redirect back
            externalApi.addListener('videoConferenceLeft', () => {
              if (role === 'psychiatrist') {
                router.push('/psychiatrist/appointments');
              } else {
                router.push('/dashboard/bookings');
              }
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
          spinner={() => (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 h-full text-white">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-sm font-semibold tracking-wider uppercase">Connecting to Secure Room...</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
