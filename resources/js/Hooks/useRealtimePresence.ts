import { useEffect } from 'react';

type PresenceMember = {
    id: number | string;
    name?: string;
};

function dispatchPresenceSync(onlineUserIds: number[]) {
    (window as typeof window & { __cmailOnlineUserIds?: number[] }).__cmailOnlineUserIds = onlineUserIds;

    window.dispatchEvent(
        new CustomEvent('cmail:presence-sync', {
            detail: {
                onlineUserIds,
            },
        }),
    );
}

function dispatchPresenceChange(userId: number, isOnline: boolean) {
    window.dispatchEvent(
        new CustomEvent('cmail:presence-change', {
            detail: {
                userId,
                isOnline,
            },
        }),
    );
}

export function useRealtimePresence() {
    useEffect(() => {
        const ping = async () => {
            await window.axios.post(route('presence.ping'));
        };

        void ping();

        const heartbeatId = window.setInterval(() => {
            void ping();
        }, 60000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void ping();
            }
        };

        const handleBrowserOnline = () => {
            void ping();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleBrowserOnline);

        const presenceChannel = window.Echo?.join('contacts.presence');
        const onlineUserIds = new Set<number>();

        presenceChannel?.here((members: PresenceMember[]) => {
            onlineUserIds.clear();

            members.forEach((member) => {
                onlineUserIds.add(Number(member.id));
            });

            dispatchPresenceSync(Array.from(onlineUserIds));
        });

        presenceChannel?.joining((member: PresenceMember) => {
            const userId = Number(member.id);
            onlineUserIds.add(userId);
            dispatchPresenceChange(userId, true);
            dispatchPresenceSync(Array.from(onlineUserIds));
        });

        presenceChannel?.leaving((member: PresenceMember) => {
            const userId = Number(member.id);
            onlineUserIds.delete(userId);
            dispatchPresenceChange(userId, false);
            dispatchPresenceSync(Array.from(onlineUserIds));
        });

        return () => {
            window.clearInterval(heartbeatId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleBrowserOnline);
            window.Echo?.leave('contacts.presence');
        };
    }, []);
}
