<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Invitation Evenement</title>
    <style>
        @page { margin: 28px; }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.45;
            margin: 0;
        }
        .card {
            border: 1px solid #dbeafe;
            border-radius: 14px;
            overflow: hidden;
        }
        .header {
            background: #0f172a;
            color: #f8fafc;
            padding: 18px 20px;
        }
        .header .title {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px;
        }
        .header .subtitle {
            margin: 0;
            color: #cbd5e1;
            font-size: 12px;
        }
        .body {
            padding: 18px 20px;
            background: #ffffff;
        }
        .badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0c4a6e;
            border: 1px solid #bae6fd;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .4px;
        }
        .event-title {
            font-size: 18px;
            margin: 12px 0 10px;
            font-weight: 700;
            color: #020617;
        }
        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .info-grid td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            vertical-align: top;
        }
        .muted { color: #475569; }
        .section {
            margin-top: 14px;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
        }
        .footer {
            margin-top: 16px;
            font-size: 10px;
            color: #64748b;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <p class="title">Invitation Officielle</p>
            <p class="subtitle">CMAIL / CHU - Communication interne</p>
        </div>

        <div class="body">
            <span class="badge">{{ $event?->type === 'online' ? 'Zoom / Online' : 'Presentiel' }}</span>

            <p class="event-title">{{ $event?->title ?? 'Evenement' }}</p>

            @if(!empty($event?->description))
                <p class="muted">{{ $event->description }}</p>
            @endif

            <table class="info-grid">
                <tr>
                    <td width="30%"><strong>Invite</strong></td>
                    <td>{{ $invitee?->name ?? '-' }} ({{ $invitee?->email ?? '-' }})</td>
                </tr>
                <tr>
                    <td><strong>Organisateur</strong></td>
                    <td>{{ $organizer?->name ?? '-' }} ({{ $organizer?->email ?? '-' }})</td>
                </tr>
                <tr>
                    <td><strong>Date debut</strong></td>
                    <td>{{ optional($event?->start_time)->format('d/m/Y H:i') ?? '-' }}</td>
                </tr>
                <tr>
                    <td><strong>Date fin</strong></td>
                    <td>{{ optional($event?->end_time)->format('d/m/Y H:i') ?? '-' }}</td>
                </tr>
                <tr>
                    <td><strong>{{ $event?->type === 'online' ? 'Lien Zoom' : 'Lieu' }}</strong></td>
                    <td>{{ $event?->type === 'online' ? ($event?->meeting_link ?? '-') : ($event?->location ?? '-') }}</td>
                </tr>
                <tr>
                    <td><strong>Statut invitation</strong></td>
                    <td>{{ strtoupper((string) ($invitation?->status ?? 'pending')) }}</td>
                </tr>
            </table>

            <div class="section">
                Merci de confirmer votre presence depuis l'application Cmail.
            </div>

            <p class="footer">
                Genere le {{ optional($generatedAt)->format('d/m/Y H:i') }}
            </p>
        </div>
    </div>
</body>
</html>
