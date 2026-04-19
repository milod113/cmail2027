<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation Événement</title>
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <!-- Fallback gradient for email clients -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 0;">
        <tr>
            <td align="center">
                <!-- Main Card -->
                <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">

                    <!-- Decorative Top Bar -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:0;height:6px;">
                            <div style="background:linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6);height:6px;"></div>
                        </td>
                    </tr>

                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:32px 32px 28px;color:#ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle;">
                                        <!-- Logo/Icon -->
                                        <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:16px;padding:8px 12px;margin-bottom:16px;">
                                            <span style="font-size:24px;">📅</span>
                                        </div>
                                        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Invitation à un événement</h1>
                                        <p style="margin:0;color:#94a3b8;font-size:14px;">Cmail · Système d'invitations CHU</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr style="background:#ffffff;">
                        <td style="padding:36px 32px;">
                            <!-- Greeting -->
                            <div style="margin-bottom:28px;">
                                <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0f172a;">
                                    Bonjour {{ $invitee?->name ?? 'Cher collègue' }},
                                </h2>
                                <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
                                    Vous êtes invité(e) à participer à l'événement suivant :
                                </p>
                            </div>

                            <!-- Event Title Card -->
                            <div style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);border-radius:20px;padding:24px;margin-bottom:28px;border:1px solid #e2e8f0;">
                                <div style="display:inline-block;background:linear-gradient(135deg, #06b6d4, #3b82f6);border-radius:12px;padding:6px 12px;margin-bottom:16px;">
                                    <span style="color:#ffffff;font-size:12px;font-weight:600;">✨ ÉVÉNEMENT SPÉCIAL</span>
                                </div>
                                <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
                                    {{ $event?->title ?? 'Événement' }}
                                </h2>
                                @if(!empty($event?->description))
                                    <p style="margin:12px 0 0;color:#475569;font-size:14px;line-height:1.6;">
                                        {{ $event->description }}
                                    </p>
                                @endif
                            </div>

                            <!-- Event Details Table -->
                            <div style="margin-bottom:28px;">
                                <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0f172a;">📋 Détails de l'événement</h3>

                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                    <!-- Date de début -->
                                    <tr>
                                        <td style="padding:14px 16px;background:#f8fafc;border-radius:12px 0 0 12px;width:140px;border-bottom:1px solid #e2e8f0;">
                                            <div style="display:flex;align-items:center;gap:8px;">
                                                <span style="font-size:18px;">📅</span>
                                                <strong style="color:#0f172a;font-size:13px;">Date de début</strong>
                                            </div>
                                        </td>
                                        <td style="padding:14px 16px;background:#ffffff;border-radius:0 12px 12px 0;border-bottom:1px solid #e2e8f0;">
                                            <span style="color:#1e293b;font-size:14px;font-weight:500;">
                                                {{ optional($event?->start_time)->format('d/m/Y') ?? '-' }}
                                            </span>
                                            <span style="color:#64748b;font-size:13px;margin-left:8px;">
                                                {{ optional($event?->start_time)->format('H:i') ?? '' }}
                                            </span>
                                         </td>
                                    </tr>

                                    <!-- Date de fin -->
                                    <tr>
                                        <td style="padding:14px 16px;background:#f8fafc;width:140px;border-bottom:1px solid #e2e8f0;">
                                            <div style="display:flex;align-items:center;gap:8px;">
                                                <span style="font-size:18px;">⏰</span>
                                                <strong style="color:#0f172a;font-size:13px;">Date de fin</strong>
                                            </div>
                                         </td>
                                        <td style="padding:14px 16px;background:#ffffff;border-bottom:1px solid #e2e8f0;">
                                            <span style="color:#1e293b;font-size:14px;font-weight:500;">
                                                {{ optional($event?->end_time)->format('d/m/Y') ?? '-' }}
                                            </span>
                                            <span style="color:#64748b;font-size:13px;margin-left:8px;">
                                                {{ optional($event?->end_time)->format('H:i') ?? '' }}
                                            </span>
                                         </td>
                                    </tr>

                                    <!-- Lieu / Lien -->
                                    <tr>
                                        <td style="padding:14px 16px;background:#f8fafc;width:140px;border-radius:0 0 0 12px;">
                                            <div style="display:flex;align-items:center;gap:8px;">
                                                <span style="font-size:18px;">
                                                    {{ $event?->type === 'online' ? '🔗' : '📍' }}
                                                </span>
                                                <strong style="color:#0f172a;font-size:13px;">
                                                    {{ $event?->type === 'online' ? 'Lien de réunion' : 'Lieu' }}
                                                </strong>
                                            </div>
                                         </td>
                                        <td style="padding:14px 16px;background:#ffffff;border-radius:0 0 12px 0;">
                                            @if($event?->type === 'online')
                                                <a href="{{ $event->meeting_link }}" style="color:#06b6d4;text-decoration:none;font-size:13px;word-break:break-all;">
                                                    {{ $event->meeting_link ?? '-' }}
                                                </a>
                                            @else
                                                <span style="color:#1e293b;font-size:14px;font-weight:500;">
                                                    {{ $event->location ?? '-' }}
                                                </span>
                                            @endif
                                         </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Organizer Info -->
                            <div style="background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);border-radius:16px;padding:16px;margin-bottom:28px;border:1px solid #fbbf24;">
                                <div style="display:flex;align-items:center;gap:12px;">
                                    <span style="font-size:24px;">👤</span>
                                    <div>
                                        <p style="margin:0;font-size:11px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">
                                            Organisateur
                                        </p>
                                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#78350f;">
                                            {{ $organizer?->name ?? '-' }}
                                        </p>
                                        <p style="margin:2px 0 0;font-size:12px;color:#92400e;">
                                            {{ $organizer?->email ?? '-' }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Attachment Info -->
                            <div style="background:#f0fdf4;border-radius:16px;padding:16px;margin-bottom:28px;border:1px solid #86efac;">
                                <div style="display:flex;align-items:center;gap:12px;">
                                    <span style="font-size:24px;">📎</span>
                                    <div>
                                        <p style="margin:0;font-size:13px;font-weight:600;color:#166534;">
                                            Document officiel joint
                                        </p>
                                        <p style="margin:4px 0 0;font-size:12px;color:#15803d;">
                                            Le PDF de votre invitation est attaché à cet email
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align:center;margin-bottom:20px;">
                                <a href="{{ $event ? route('events.show', $event->id) : route('events.invitations') }}"
                                   style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:#ffffff;text-decoration:none;border-radius:60px;font-size:15px;font-weight:600;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                                    ✨ Voir l'invitation dans Cmail
                                </a>
                            </div>

                            <!-- Quick Actions Note -->
                            <div style="text-align:center;">
                                <p style="margin:0;font-size:12px;color:#94a3b8;">
                                    Connectez-vous à Cmail pour confirmer ou refuser votre participation
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align:center;">
                                        <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                                            Cet email a été envoyé via le système d'invitations Cmail
                                        </p>
                                        <p style="margin:0;font-size:11px;color:#94a3b8;">
                                            © {{ date('Y') }} CHU - Tous droits réservés
                                        </p>
                                        <div style="margin-top:16px;">
                                            <span style="display:inline-block;width:6px;height:6px;background:#cbd5e1;border-radius:50%;margin:0 4px;"></span>
                                            <span style="font-size:11px;color:#94a3b8;">Plateforme d'invitations</span>
                                            <span style="display:inline-block;width:6px;height:6px;background:#cbd5e1;border-radius:50%;margin:0 4px;"></span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Subtle footer note -->
                <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;margin-top:20px;">
                    <tr>
                        <td style="text-align:center;padding:16px;">
                            <p style="margin:0;font-size:11px;color:#94a3b8;">
                                Ce message est automatique, merci de ne pas y répondre.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
