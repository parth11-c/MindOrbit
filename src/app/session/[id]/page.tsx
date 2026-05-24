import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import SessionClient from './session-client';

export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const role = user.publicMetadata?.role as 'patient' | 'psychiatrist' || 'patient';
  
  // Create a unique deterministic room name from the booking ID to ensure both parties join the same room
  const uniqueRoomName = `mindorbit-session-${id}`;
  const userName = `${user.firstName} ${user.lastName}`.trim() || 'Guest';
  const userEmail = user.emailAddresses[0]?.emailAddress || 'guest@mindorbit.com';

  return (
    <SessionClient
      roomName={uniqueRoomName}
      userName={userName}
      userEmail={userEmail}
      role={role}
    />
  );
}
