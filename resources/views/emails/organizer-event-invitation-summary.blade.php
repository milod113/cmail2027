<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recapitulatif des invitations</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
        <tr>
            <td align="center">
                <table width="680" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background:#0f172a;padding:20px 24px;color:#f8fafc;">
                            <h1 style="margin:0;font-size:22px;line-height:1.2;">Recapitulatif des invitations</h1>
                            <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;">{{ $event?->title ?? 'Evenement' }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px 24px;color:#0f172a;">
                            <p style="margin:0 0 14px;font-size:14px;">
                                Bonjour {{ $organizer?->name ?? 'Organisateur' }},
                            </p>

                            <p style="margin:0 0 14px;font-size:14px;">
                                Votre evenement a ete cree. Voici le resultat de l'envoi des invitations email.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin:0 0 18px;">
                                <tr>
                                    <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;background:#f8fafc;"><strong>Emails envoyes</strong></td>
                                    <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;">{{ $sentCount }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;background:#f8fafc;"><strong>Sans email</strong></td>
                                    <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;">{{ $skippedCount }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;background:#f8fafc;"><strong>Echecs</strong></td>
                                    <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;">{{ $failedCount }}</td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
                                <tr>
                                    <td style="padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px;font-weight:700;">Invite</td>
                                    <td style="padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px;font-weight:700;">Email</td>
                                    <td style="padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px;font-weight:700;">Envoi</td>
                                </tr>
                                @foreach($deliveryStatuses as $row)
                                    <tr>
                                        <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;">{{ $row['name'] }}</td>
                                        <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;">{{ $row['email'] }}</td>
                                        <td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;">
                                            @if($row['delivery'] === 'sent')
                                                Envoye
                                            @elseif($row['delivery'] === 'skipped')
                                                Ignore
                                            @else
                                                Echec
                                            @endif

                                            @if(!empty($row['error']))
                                                <div style="margin-top:4px;color:#64748b;font-size:11px;">{{ $row['error'] }}</div>
                                            @endif
                                        </td>
                                    </tr>
                                @endforeach
                            </table>

                            <p style="margin:18px 0 0;font-size:13px;color:#64748b;">
                                Accedez au detail de l'evenement depuis l'application Cmail.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
