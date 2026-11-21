{{ $isReply ? 'NOUVELLE RÉPONSE' : 'NOUVEAU MESSAGE' }}{{ $important ? ' — IMPORTANT' : '' }} — Cmail, CHU de Tlemcen

Bonjour {{ $recipientName }},

{{ $isReply ? 'Vous avez reçu une réponse dans Cmail.' : 'Vous avez reçu un nouveau message dans Cmail.' }}

De : {{ $senderName }}{{ $senderDetail ? ' ('.$senderDetail.')' : '' }}
Objet : {{ $subject }}
@if ($sentAt)
Reçu le : {{ $sentAt }}
@endif
@if ($deadline)
Réponse attendue avant le {{ $deadline }}
@endif
@if ($requiresReceipt)
L'expéditeur demande un accusé de réception.
@endif
@if ($hasAttachment)
Ce message contient une pièce jointe.
@endif

@if ($url)
Ouvrir le message : {{ $url }}
@else
Ouvrez l'application Cmail pour lire ce message.
@endif

Pour protéger les informations médicales, le contenu du message n'est pas recopié dans cet e-mail.

--
Cmail — Messagerie interne du CHU de Tlemcen. E-mail automatique, merci de ne pas y répondre.
Désactiver ces e-mails : Cmail > Profil > Notifications par e-mail.
