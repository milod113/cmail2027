import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { useTranslation } from '@/Hooks/useTranslation';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const { __ } = useTranslation();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="mb-6">
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                    {__('Supprimer le compte')}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {__('Une fois votre compte supprimé, toutes ses ressources et données seront définitivement supprimées. Avant de supprimer votre compte, veuillez conserver les informations que vous souhaitez garder.')}
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/30">
                {__('Supprimer le compte')}
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                        {__('Êtes-vous sûr de vouloir supprimer votre compte ?')}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {__('Une fois votre compte supprimé, toutes ses ressources et données seront définitivement supprimées. Veuillez saisir votre mot de passe pour confirmer cette suppression définitive.')}
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value={__('Mot de passe')}
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-3/4"
                            isFocused
                            placeholder={__('Mot de passe')}
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            {__('Annuler')}
                        </SecondaryButton>

                        <DangerButton className="ms-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700" disabled={processing}>
                            {__('Supprimer le compte')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
