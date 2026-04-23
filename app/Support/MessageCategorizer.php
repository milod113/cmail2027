<?php

namespace App\Support;

use Illuminate\Support\Str;

class MessageCategorizer
{
    /**
     * @return array<int, string>
     */
    public static function categories(): array
    {
        return [
            'urgent',
            'validation',
            'finance',
            'rh',
            'reunion',
            'support',
            'delegation',
            'reponse',
            'absence',
            'information',
        ];
    }

    /**
     * @return array{category: string, source: string, confidence: float}
     */
    public function categorize(string $subject, string $content, ?string $typeMessage = null): array
    {
        $normalizedType = $this->normalize($typeMessage ?? '');
        $normalizedText = $this->normalize(trim($subject.' '.$content));

        $typeCategory = $this->categoryFromTypeMessage($normalizedType);

        if ($typeCategory !== null) {
            return [
                'category' => $typeCategory,
                'source' => 'rules',
                'confidence' => 0.95,
            ];
        }

        $keywordRules = [
            'urgent' => ['urgent', 'urgence', 'immediat', 'immediate', 'asap', 'priorite haute', 'critique'],
            'validation' => ['validation', 'valider', 'approuver', 'approbation', 'visa', 'autorisation', 'signature'],
            'finance' => ['budget', 'facture', 'paiement', 'depense', 'finance', 'financier', 'achat', 'commande'],
            'rh' => ['conge', 'absence', 'recrutement', 'ressources humaines', 'rh', 'personnel', 'planning equipe'],
            'reunion' => ['reunion', 'meeting', 'ordre du jour', 'conference', 'visioconference', 'invitation'],
            'support' => ['incident', 'support', 'bug', 'panne', 'erreur', 'ticket', 'probleme technique'],
        ];

        foreach ($keywordRules as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($normalizedText, $keyword)) {
                    return [
                        'category' => $category,
                        'source' => 'rules',
                        'confidence' => 0.82,
                    ];
                }
            }
        }

        return [
            'category' => 'information',
            'source' => 'rules',
            'confidence' => 0.40,
        ];
    }

    private function categoryFromTypeMessage(string $normalizedType): ?string
    {
        return match (true) {
            $normalizedType === 'urgent' => 'urgent',
            $normalizedType === 'reply' => 'reponse',
            $normalizedType === 'delegated' => 'delegation',
            $normalizedType === 'out_of_office' => 'absence',
            $normalizedType === 'support_reply' => 'support',
            str_starts_with($normalizedType, 'recurring_') => 'information',
            in_array($normalizedType, ['information', 'normal'], true) => null,
            default => null,
        };
    }

    private function normalize(string $value): string
    {
        return Str::lower(Str::ascii($value));
    }
}
