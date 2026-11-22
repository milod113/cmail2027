<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class AppVersionTest extends TestCase
{
    public function test_app_version_is_public_and_describes_the_latest_release(): void
    {
        $this->getJson('/api/mobile/app-version')
            ->assertOk()
            ->assertJsonStructure(['version', 'build', 'notes', 'force', 'apk_url'])
            ->assertJsonPath('build', fn ($build) => is_int($build) && $build >= 1);
    }
}
