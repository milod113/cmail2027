import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useTranslation } from '@/Hooks/useTranslation';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    profile,
    success,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    profile: any;
    success?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const { __ } = useTranslation();
    const fileInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            matricule: profile?.matricule || '',
            grade: profile?.grade || '',
            telephone: profile?.telephone || '',
            adresse: profile?.adresse || '',
            photo: null as File | null,
            _method: 'PATCH',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            onSuccess: () => {
                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
        }
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                    {__('Informations du profil')}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {__('Mettez à jour les informations de votre profil et votre adresse email.')}
                </p>
            </header>

            {success && (
                <div className="mt-4 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-sm text-green-800 dark:border-green-800/50 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300">
                    {success}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="name" value={__('Nom')} />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value={__('Email')} />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/50 p-4 dark:border-slate-700 dark:from-slate-800/50 dark:to-cyan-900/20">
                    <h3 className="text-base font-medium text-slate-800 dark:text-slate-100">
                        {__('Informations professionnelles')}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {__('Informations supplémentaires sur votre profil professionnel.')}
                    </p>
                </div>

                <div>
                    <InputLabel htmlFor="matricule" value={__('Matricule')} />

                    <TextInput
                        id="matricule"
                        className="mt-1 block w-full"
                        value={data.matricule}
                        onChange={(e) => setData('matricule', e.target.value)}
                        autoComplete="off"
                    />

                    <InputError className="mt-2" message={errors.matricule} />
                </div>

                <div>
                    <InputLabel htmlFor="grade" value={__('Grade')} />

                    <TextInput
                        id="grade"
                        className="mt-1 block w-full"
                        value={data.grade}
                        onChange={(e) => setData('grade', e.target.value)}
                        autoComplete="off"
                    />

                    <InputError className="mt-2" message={errors.grade} />
                </div>

                <div>
                    <InputLabel htmlFor="telephone" value={__('Téléphone')} />

                    <TextInput
                        id="telephone"
                        type="tel"
                        className="mt-1 block w-full"
                        value={data.telephone}
                        onChange={(e) => setData('telephone', e.target.value)}
                        autoComplete="tel"
                    />

                    <InputError className="mt-2" message={errors.telephone} />
                </div>

                <div>
                    <InputLabel htmlFor="adresse" value={__('Adresse')} />

                    <textarea
                        id="adresse"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-600 dark:focus:ring-cyan-600/20"
                        rows={3}
                        value={data.adresse}
                        onChange={(e) => setData('adresse', e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.adresse} />
                </div>

                <div>
                    <InputLabel htmlFor="photo" value={__('Photo de profil')} />

                    {profile?.photo && (
                        <div className="mt-2">
                            <img
                                src={`/storage/${profile.photo}`}
                                alt={__('Photo de profil')}
                                className="h-24 w-24 rounded-full border-2 border-cyan-200 object-cover shadow-md dark:border-cyan-800"
                            />
                        </div>
                    )}

                    <input
                        ref={fileInput}
                        id="photo"
                        type="file"
                        className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-600 file:to-sky-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:from-cyan-700 hover:file:to-sky-800 dark:text-slate-300 dark:file:from-cyan-500 dark:file:to-sky-600 dark:hover:file:from-cyan-600 dark:hover:file:to-sky-700"
                        accept="image/*"
                        onChange={handlePhotoChange}
                    />

                    <InputError className="mt-2" message={errors.photo} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-300">
                        <p className="text-slate-800">
                            {__('Votre adresse email n\u2019est pas vérifiée.')}{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="font-medium underline underline-offset-2 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:hover:text-amber-200"
                            >
                                {__('Cliquez ici pour renvoyer l\u2019email de vérification.')}
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
                                {__('Un nouveau lien de vérification a été envoyé à votre adresse email.')}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:items-center">
                    <PrimaryButton disabled={processing} className="w-full bg-gradient-to-r from-cyan-600 to-sky-700 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-700 hover:to-sky-800 hover:shadow-xl hover:shadow-cyan-500/30 sm:w-auto">
                        {__('Enregistrer')}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful || !!success}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {__('Enregistré.')}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
