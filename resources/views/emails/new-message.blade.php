@php
    /*
     * E-mail « nouveau message » Cmail — compatible Gmail / Outlook / téléphone :
     * mise en page en tableaux, styles en ligne, logo intégré à l'e-mail (CID).
     * Confidentialité : le texte du message n'est JAMAIS recopié ici.
     */
    $orange = '#FF6B00';
    $amber = '#EA580C';
    $ink = '#0F172A';
    $slate = '#475569';
    $muted = '#64748B';
    $line = '#E2E8F0';
    $logo = isset($message) ? $message->embed(resource_path('email/cmail-logo.png')) : null;
    $initials = collect(preg_split('/\s+/', trim($senderName)))->filter()->take(2)
        ->map(fn ($p) => mb_strtoupper(mb_substr($p, 0, 1)))->implode('');
@endphp
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $title }}</title>
    <style>
        @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .px { padding-left: 22px !important; padding-right: 22px !important; }
            .h1 { font-size: 22px !important; line-height: 30px !important; }
        }
        a { color: {{ $orange }}; }
    </style>
</head>
<body style="margin:0; padding:0; background:#F1F5F9; -webkit-text-size-adjust:100%;">
{{-- Texte d'aperçu (affiché par Gmail à côté de l'objet) --}}
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    {{ $isReply ? 'Nouvelle réponse' : 'Nouveau message' }} de {{ $senderName }} — {{ $subject }}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
    <tr>
        <td align="center" style="padding:32px 12px;">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0"
                   style="width:600px; max-width:600px; background:#FFFFFF; border-radius:20px; overflow:hidden;
                          border:1px solid {{ $line }}; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

                {{-- Bandeau dégradé orange --}}
                <tr>
                    <td style="height:6px; line-height:6px; font-size:0; background:{{ $orange }};
                               background-image:linear-gradient(90deg, {{ $orange }}, {{ $amber }});">&nbsp;</td>
                </tr>

                {{-- En-tête : logo + nom --}}
                <tr>
                    <td class="px" style="padding:26px 36px 8px 36px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                @if ($logo)
                                    <td style="vertical-align:middle; padding-right:14px;">
                                        <img src="{{ $logo }}" width="52" height="52" alt="Cmail"
                                             style="display:block; width:52px; height:52px; border:0; border-radius:14px;">
                                    </td>
                                @endif
                                <td style="vertical-align:middle;">
                                    <div style="font-size:24px; line-height:26px; font-weight:800; color:{{ $ink }}; letter-spacing:-0.3px;">Cmail</div>
                                    <div style="font-size:11px; line-height:16px; font-weight:700; color:{{ $muted }}; letter-spacing:1.4px; text-transform:uppercase;">
                                        Messagerie interne sécurisée · CHU de Tlemcen
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Pastilles + titre --}}
                <tr>
                    <td class="px" style="padding:22px 36px 0 36px;">
                        <span style="display:inline-block; padding:5px 12px; border-radius:999px; background:#FFF7ED;
                                     border:1px solid #FED7AA; color:{{ $amber }}; font-size:12px; font-weight:800; letter-spacing:0.3px;">
                            {{ $isReply ? '↩︎ Nouvelle réponse' : '✉︎ Nouveau message' }}
                        </span>
                        @if ($important)
                            <span style="display:inline-block; margin-left:6px; padding:5px 12px; border-radius:999px; background:#FEF2F2;
                                         border:1px solid #FECACA; color:#DC2626; font-size:12px; font-weight:800; letter-spacing:0.3px;">
                                ★ Important
                            </span>
                        @endif
                        <h1 class="h1" style="margin:16px 0 6px 0; font-size:25px; line-height:33px; font-weight:800; color:{{ $ink }}; letter-spacing:-0.4px;">
                            Bonjour {{ $recipientName }},
                        </h1>
                        <p style="margin:0; font-size:16px; line-height:25px; color:{{ $slate }};">
                            {{ $isReply ? 'Vous avez reçu une réponse dans Cmail.' : 'Vous avez reçu un nouveau message dans Cmail.' }}
                        </p>
                    </td>
                </tr>

                {{-- Carte : expéditeur + objet --}}
                <tr>
                    <td class="px" style="padding:22px 36px 0 36px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="background:#F8FAFC; border:1px solid {{ $line }}; border-radius:16px;">
                            <tr>
                                <td style="padding:18px 20px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="vertical-align:middle; padding-right:12px;">
                                                <div style="width:46px; height:46px; border-radius:23px; background:{{ $orange }};
                                                            background-image:linear-gradient(135deg, #FB923C, {{ $amber }});
                                                            color:#FFFFFF; font-size:16px; font-weight:800; line-height:46px; text-align:center;">
                                                    {{ $initials ?: '?' }}
                                                </div>
                                            </td>
                                            <td style="vertical-align:middle;">
                                                <div style="font-size:16px; line-height:21px; font-weight:800; color:{{ $ink }};">{{ $senderName }}</div>
                                                @if ($senderDetail)
                                                    <div style="font-size:13px; line-height:19px; color:{{ $muted }};">{{ $senderDetail }}</div>
                                                @endif
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="height:1px; line-height:1px; font-size:0; background:{{ $line }}; margin:16px 0 14px 0;">&nbsp;</div>

                                    <div style="font-size:11px; line-height:16px; font-weight:800; color:{{ $muted }}; letter-spacing:1.2px; text-transform:uppercase;">Objet</div>
                                    <div style="margin-top:4px; font-size:17px; line-height:25px; font-weight:700; color:{{ $ink }};">{{ $subject }}</div>
                                    @if ($sentAt)
                                        <div style="margin-top:6px; font-size:13px; line-height:18px; color:{{ $muted }};">Reçu le {{ $sentAt }}</div>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Indications : pièce jointe, accusé, date limite --}}
                @if ($hasAttachment || $requiresReceipt || $deadline)
                    <tr>
                        <td class="px" style="padding:14px 36px 0 36px;">
                            @if ($deadline)
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                                    <tr><td style="padding:12px 16px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px;
                                                   font-size:14px; line-height:20px; color:#92400E;">
                                        ⏳ <strong>Réponse attendue avant le {{ $deadline }}</strong>
                                    </td></tr>
                                </table>
                            @endif
                            @if ($requiresReceipt)
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                                    <tr><td style="padding:12px 16px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px;
                                                   font-size:14px; line-height:20px; color:#166534;">
                                        ✔ L'expéditeur demande un <strong>accusé de réception</strong>.
                                    </td></tr>
                                </table>
                            @endif
                            @if ($hasAttachment)
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                                    <tr><td style="padding:12px 16px; background:#F8FAFC; border:1px solid {{ $line }}; border-radius:12px;
                                                   font-size:14px; line-height:20px; color:{{ $slate }};">
                                        📎 Ce message contient une <strong>pièce jointe</strong>, à consulter dans Cmail.
                                    </td></tr>
                                </table>
                            @endif
                        </td>
                    </tr>
                @endif

                {{-- Bouton / consigne --}}
                <tr>
                    <td class="px" align="left" style="padding:22px 36px 0 36px;">
                        @if ($url)
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-radius:14px; background:{{ $orange }};
                                               background-image:linear-gradient(90deg, {{ $orange }}, {{ $amber }});">
                                        <a href="{{ $url }}" target="_blank"
                                           style="display:inline-block; padding:15px 30px; font-size:16px; font-weight:800;
                                                  color:#FFFFFF; text-decoration:none; border-radius:14px;">
                                            Ouvrir le message dans Cmail&nbsp;→
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        @else
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr><td style="padding:14px 16px; background:#FFF7ED; border-radius:12px;
                                               font-size:14px; line-height:21px; color:#9A3412;">
                                    📱 Ouvrez l'<strong>application Cmail</strong> (ou le site Cmail sur le réseau de l'établissement) pour lire ce message.
                                </td></tr>
                            </table>
                        @endif
                    </td>
                </tr>

                {{-- Confidentialité --}}
                <tr>
                    <td class="px" style="padding:24px 36px 28px 36px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="width:28px; vertical-align:top; font-size:18px; line-height:20px;">🔒</td>
                                <td style="font-size:13px; line-height:20px; color:{{ $muted }};">
                                    Pour protéger les informations médicales, <strong style="color:{{ $slate }};">le contenu du message n'est pas recopié dans cet e-mail</strong>.
                                    Il reste stocké uniquement sur le serveur de l'établissement.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Pied de page --}}
                <tr>
                    <td class="px" style="padding:18px 36px 22px 36px; background:#F8FAFC; border-top:1px solid {{ $line }};">
                        <div style="font-size:12px; line-height:18px; color:{{ $muted }};">
                            <strong style="color:{{ $slate }};">Cmail</strong> — Messagerie interne du CHU de Tlemcen.<br>
                            Cet e-mail est envoyé automatiquement, merci de ne pas y répondre.<br>
                            Vous pouvez désactiver ces notifications dans Cmail : <em>Profil → Notifications par e-mail</em>.
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
