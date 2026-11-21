<?php

namespace App\Support;

use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageEmailNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Envoie l'e-mail « nouveau message » au destinataire quand un message est LIVRÉ
 * (envoi direct, réponse, message groupé, programmé ou récurrent arrivé à échéance).
 *
 * Pas d'e-mail : message programmé pas encore livré, message à soi-même, compte bloqué,
 * adresse invalide, spam, ou destinataire ayant désactivé l'option dans son profil.
 */
class MessageEmailNotifier
{
    /** Interrupteur global (désactivé par les seeders de démonstration). */
    public static bool $enabled = true;

    public static function delivered(Message $message): void
    {
        if (! self::$enabled || ! $message->is_delivered || $message->status === 'scheduled' || $message->spam) {
            return;
        }

        $receiverId = (int) $message->receiver_id;
        if ($receiverId <= 0 || $receiverId === (int) $message->sender_id) {
            return;
        }

        $receiver = User::query()->with('settings')->find($receiverId);
        if (! $receiver || $receiver->is_blocked) {
            return;
        }
        if (! filter_var((string) $receiver->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }
        // Sans réglage enregistré : e-mails activés
        if ($receiver->settings && $receiver->settings->email_notifications === false) {
            return;
        }

        // Un seul e-mail par message, même si la livraison est signalée deux fois
        if (! Cache::add('cmail-mail-sent:'.$message->id, 1, now()->addDays(2))) {
            return;
        }

        try {
            $receiver->notify(new NewMessageEmailNotification((int) $message->id));
        } catch (\Throwable $e) {
            // L'e-mail est un complément : un échec ne doit jamais bloquer l'envoi du message
            Log::warning('E-mail de nouveau message non mis en file.', ['message_id' => $message->id, 'error' => $e->getMessage()]);
        }
    }
}
