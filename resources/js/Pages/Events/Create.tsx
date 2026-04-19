import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEvent, useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    MapPin,
    Search,
    UsersRound,
    Video,
    ArrowLeft,
    Plus,
    CheckCircle2,
    AlertCircle,
    Building2,
    Mail,
    User,
    Calendar,
    Clock,
    Link2,
    MapPinned,
    Sparkles,
    Users,
} from 'lucide-react';
import { Link } from '@inertiajs/react';

type Invitee = {
    id: number;
    name: string;
    email: string;
    role_name: string | null;
    department_name: string | null;
};

type CreateEventProps = {
    invitees: Invitee[];
};

function toDatetimeLocal(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hour = String(value.getHours()).padStart(2, '0');
    const minute = String(value.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function Create({ invitees }: CreateEventProps) {
    const startDefault = useMemo(() => {
        const nextHour = new Date();
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(nextHour.getHours() + 1);

        return nextHour;
    }, []);

    const endDefault = useMemo(() => {
        const nextTwoHours = new Date(startDefault);
        nextTwoHours.setHours(nextTwoHours.getHours() + 1);

        return nextTwoHours;
    }, [startDefault]);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('__all__');
    const [isFocused, setIsFocused] = useState<'title' | 'description' | null>(null);

    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        description: string;
        type: 'in_person' | 'online';
        location: string;
        meeting_link: string;
        start_time: string;
        end_time: string;
        invitee_ids: number[];
    }>({
        title: '',
        description: '',
        type: 'in_person',
        location: '',
        meeting_link: '',
        start_time: toDatetimeLocal(startDefault),
        end_time: toDatetimeLocal(endDefault),
        invitee_ids: [],
    });

    const roleOptions = useMemo(() => {
        const roles = invitees.map((invitee) => (invitee.role_name?.trim() || 'Sans rôle'));
        return Array.from(new Set(roles)).sort((a, b) => a.localeCompare(b));
    }, [invitees]);

    const visibleInvitees = invitees.filter((invitee) => {
        const q = search.trim().toLowerCase();
        const inviteeRole = invitee.role_name?.trim() || 'Sans rôle';

        if (roleFilter !== '__all__' && inviteeRole !== roleFilter) {
            return false;
        }

        if (!q) {
            return true;
        }

        return (
            invitee.name.toLowerCase().includes(q) ||
            invitee.email.toLowerCase().includes(q) ||
            (invitee.role_name ?? '').toLowerCase().includes(q) ||
            (invitee.department_name ?? '').toLowerCase().includes(q)
        );
    });

    const selectAllVisible = () => {
        const visibleIds = visibleInvitees.map((invitee) => invitee.id);
        setData('invitee_ids', Array.from(new Set([...data.invitee_ids, ...visibleIds])));
    };

    const deselectAllVisible = () => {
        const visibleIds = new Set(visibleInvitees.map((invitee) => invitee.id));
        setData('invitee_ids', data.invitee_ids.filter((id) => !visibleIds.has(id)));
    };

    const toggleInvitee = (inviteeId: number) => {
        setData(
            'invitee_ids',
            data.invitee_ids.includes(inviteeId)
                ? data.invitee_ids.filter((id) => id !== inviteeId)
                : [...data.invitee_ids, inviteeId]
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('events.store'), {
            preserveScroll: true,
        });
    };

    const selectedCount = data.invitee_ids.length;
    const totalInvitees = visibleInvitees.length;

    return (
        <AuthenticatedLayout
            title="Créer un événement"
            description="Planifiez un événement présentiel ou en ligne et invitez le personnel"
        >
            <Head title="Créer un événement" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Link
                                href={route('events.invitations')}
                                className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                Créer un événement
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Remplissez les informations ci-dessous pour planifier votre événement
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 dark:from-emerald-500/10 dark:to-emerald-500/5">
                            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                Nouvel événement
                            </span>
                        </div>
                    </div>

                    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3 lg:gap-8">
                        {/* Main Form - Left Column */}
                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                {/* Event Details Card */}
                                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 dark:bg-slate-900 dark:shadow-slate-900/30">
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6">
                                        <h2 className="text-lg font-semibold text-white">
                                            Informations de l'événement
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Les détails essentiels de votre événement
                                        </p>
                                    </div>

                                    <div className="space-y-6 p-6">
                                        {/* Title */}
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                Titre de l'événement *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
                                                    onFocus={() => setIsFocused('title')}
                                                    onBlur={() => setIsFocused(null)}
                                                    placeholder="Ex: Réunion coordination urgences"
                                                    className={`w-full rounded-2xl border-2 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 ${
                                                        errors.title
                                                            ? 'border-rose-300 focus:border-rose-500 dark:border-rose-700'
                                                            : isFocused === 'title'
                                                            ? 'border-cyan-400 shadow-lg shadow-cyan-500/10'
                                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                                                    }`}
                                                />
                                            </div>
                                            {errors.title && (
                                                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.title}
                                                </p>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                Description
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                onFocus={() => setIsFocused('description')}
                                                onBlur={() => setIsFocused(null)}
                                                rows={5}
                                                placeholder="Ordre du jour, objectifs, informations utiles..."
                                                className={`w-full rounded-2xl border-2 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 ${
                                                    isFocused === 'description'
                                                        ? 'border-cyan-400 shadow-lg shadow-cyan-500/10'
                                                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                                                }`}
                                            />
                                        </div>

                                        {/* Event Type */}
                                        <div>
                                            <label className="mb-3 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                Type d'événement *
                                            </label>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('type', 'in_person')}
                                                    className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                                                        data.type === 'in_person'
                                                            ? 'border-cyan-400 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-lg shadow-cyan-500/10 dark:from-cyan-500/10 dark:to-blue-500/5'
                                                            : 'border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`rounded-xl p-2 ${
                                                            data.type === 'in_person'
                                                                ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            <MapPin className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                Présentiel
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                Salle, service ou espace dédié
                                                            </p>
                                                        </div>
                                                        {data.type === 'in_person' && (
                                                            <CheckCircle2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                                        )}
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setData('type', 'online')}
                                                    className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                                                        data.type === 'online'
                                                            ? 'border-cyan-400 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-lg shadow-cyan-500/10 dark:from-cyan-500/10 dark:to-blue-500/5'
                                                            : 'border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`rounded-xl p-2 ${
                                                            data.type === 'online'
                                                                ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            <Video className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                En ligne
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                Zoom, Teams ou autre plateforme
                                                            </p>
                                                        </div>
                                                        {data.type === 'online' && (
                                                            <CheckCircle2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Location / Meeting Link */}
                                        {data.type === 'in_person' ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <MapPinned className="h-4 w-4" />
                                                        Lieu *
                                                    </div>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.location}
                                                    onChange={(e) => setData('location', e.target.value)}
                                                    placeholder="Bloc administratif - Salle 2"
                                                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                                />
                                                {errors.location && (
                                                    <p className="mt-2 text-xs font-medium text-rose-600">{errors.location}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Link2 className="h-4 w-4" />
                                                        Lien de réunion *
                                                    </div>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.meeting_link}
                                                    onChange={(e) => setData('meeting_link', e.target.value)}
                                                    placeholder="https://zoom.us/j/..."
                                                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                                />
                                                {errors.meeting_link && (
                                                    <p className="mt-2 text-xs font-medium text-rose-600">{errors.meeting_link}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Date and Time */}
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Date et heure de début *
                                                    </div>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.start_time}
                                                    onChange={(e) => setData('start_time', e.target.value)}
                                                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                                />
                                                {errors.start_time && (
                                                    <p className="mt-2 text-xs font-medium text-rose-600">{errors.start_time}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Date et heure de fin *
                                                    </div>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.end_time}
                                                    onChange={(e) => setData('end_time', e.target.value)}
                                                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                                />
                                                {errors.end_time && (
                                                    <p className="mt-2 text-xs font-medium text-rose-600">{errors.end_time}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invitees Card - Right Column */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 dark:bg-slate-900 dark:shadow-slate-900/30">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-cyan-400" />
                                                <h2 className="text-lg font-semibold text-white">
                                                    Invités
                                                </h2>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-300">
                                                Sélectionnez les participants
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                                            {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Search and Filters */}
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Rechercher un utilisateur..."
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-cyan-400 focus:bg-white focus:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                            />
                                        </div>

                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-cyan-400 focus:bg-white focus:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                        >
                                            <option value="__all__">Tous les rôles</option>
                                            {roleOptions.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={selectAllVisible}
                                                disabled={totalInvitees === 0}
                                                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                Tout sélectionner
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deselectAllVisible}
                                                disabled={totalInvitees === 0}
                                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                            >
                                                Désélectionner
                                            </button>
                                        </div>
                                    </div>

                                    {/* Invitees List */}
                                    <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
                                        {visibleInvitees.length > 0 ? (
                                            visibleInvitees.map((invitee) => {
                                                const isSelected = data.invitee_ids.includes(invitee.id);
                                                return (
                                                    <label
                                                        key={invitee.id}
                                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                                                            isSelected
                                                                ? 'border-cyan-400 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md dark:from-cyan-500/10 dark:to-blue-500/5'
                                                                : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-cyan-600 dark:hover:bg-slate-800/50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleInvitee(invitee.id)}
                                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {invitee.name}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <Mail className="h-3 w-3" />
                                                                <span className="truncate">{invitee.email}</span>
                                                            </div>
                                                            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                                                                {invitee.role_name && (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                        {invitee.role_name}
                                                                    </span>
                                                                )}
                                                                {invitee.department_name && (
                                                                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                        <Building2 className="h-2.5 w-2.5" />
                                                                        {invitee.department_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                                                        )}
                                                    </label>
                                                );
                                            })
                                        ) : (
                                            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                                                <UsersRound className="mx-auto h-8 w-8 text-slate-400" />
                                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                    Aucun résultat trouvé
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {errors.invitee_ids && (
                                        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-rose-600">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.invitee_ids}
                                        </p>
                                    )}

                                    {/* Submit Button */}
                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 dark:from-cyan-600 dark:to-cyan-700"
                                        >
                                            {processing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Création en cours...
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Plus className="h-5 w-5" />
                                                    Créer l'événement
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
