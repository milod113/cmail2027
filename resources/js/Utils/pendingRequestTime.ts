export type PendingRequestTimeStatus = {
    label: string;
    totalMinutes: number;
    shouldSuggestPing: boolean;
};

export function getPendingRequestTimeStatus(value: string | null | undefined): PendingRequestTimeStatus {
    if (!value) {
        return {
            label: 'Attente depuis 0 min',
            totalMinutes: 0,
            shouldSuggestPing: false,
        };
    }

    const startedAt = new Date(value);
    const diffMs = Date.now() - startedAt.getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));

    if (totalMinutes < 60) {
        return {
            label: `Attente depuis ${totalMinutes} min`,
            totalMinutes,
            shouldSuggestPing: totalMinutes >= 30,
        };
    }

    const totalHours = Math.floor(totalMinutes / 60);

    if (totalHours < 24) {
        return {
            label: `Attente depuis ${totalHours} h`,
            totalMinutes,
            shouldSuggestPing: totalMinutes >= 30,
        };
    }

    const totalDays = Math.floor(totalHours / 24);

    return {
        label: `Attente depuis ${totalDays} j`,
        totalMinutes,
        shouldSuggestPing: totalMinutes >= 30,
    };
}
