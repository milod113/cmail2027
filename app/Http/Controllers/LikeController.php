<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function toggle(Request $request, Publication $publication): RedirectResponse
    {
        $existingLike = $publication->likes()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existingLike) {
            $existingLike->delete();
        } else {
            $publication->likes()->create([
                'user_id' => $request->user()->id,
            ]);
        }

        return back();
    }
}
