import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTranslation } from '@/Hooks/useTranslation';
import { useForm } from '@inertiajs/react';

type ReportModalProps = {
    show: boolean;
    messageId: number;
    messageSubject?: string | null;
    onClose: () => void;
    onSubmitted?: () => void;
};

type ReportFormData = {
    reason_category: string;
    comment: string;
};

const reasonOptions = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Inapproprie' },
    { value: 'technical', label: 'Technique' },
    { value: 'other', label: 'Autre' },
] as const;

export default function ReportModal({
    show,
    messageId,
    messageSubject,
    onClose,
    onSubmitted,
}: ReportModalProps) {
    const { __ } = useTranslation();
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<ReportFormData>({
        reason_category: '',
        comment: '',
    });

    const closeModal = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('messages.reports.store', messageId), {
            preserveScroll: true,
            onSuccess: () => {
                onSubmitted?.();
                closeModal();
            },
        });
    };

    return (
        <Modal show={show} onClose={closeModal} maxWidth="lg">
            <form onSubmit={submit} className="space-y-6 p-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {__('Signaler ce message')}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        {__('Ce signalement sera transmis au support technique pour analyse.')}
                    </p>
                    {messageSubject && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <span className="font-medium">{__('Objet')} :</span> {messageSubject}
                        </div>
                    )}
                </div>

                <div>
                    <InputLabel htmlFor="reason_category" value={__('Categorie du signalement')} />
                    <select
                        id="reason_category"
                        value={data.reason_category}
                        onChange={(event) => setData('reason_category', event.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">{__('Selectionnez une categorie')}</option>
                        {reasonOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {__(option.label)}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.reason_category} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="comment" value={__('Commentaire optionnel')} />
                    <textarea
                        id="comment"
                        value={data.comment}
                        onChange={(event) => setData('comment', event.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder={__('Ajoutez un contexte utile pour le support si necessaire.')}
                    />
                    <InputError message={errors.comment} className="mt-2" />
                </div>

                <div className="flex justify-end gap-3">
                    <SecondaryButton onClick={closeModal} disabled={processing}>
                        {__('Annuler')}
                    </SecondaryButton>
                    <PrimaryButton disabled={processing || !data.reason_category}>
                        {processing ? __('Envoi...') : __('Envoyer le signalement')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
