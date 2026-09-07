<?php

namespace App\Controller;

use Stripe\Stripe;
use Stripe\Checkout\Session;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class CheckoutController extends AbstractController
{
    #[Route('/api/checkout', name: 'api_checkout', methods: ['POST'])]
    public function createCheckoutSession(Request $request): JsonResponse
    {
        try {
            // Use the STRIPE_SECRET_KEY from .env
            $stripeSecret = $_ENV['STRIPE_SECRET_KEY'] ?? 'sk_test_...';
            Stripe::setApiKey($stripeSecret);

            // Redirect back to whatever site the request came from, falling back
            // to the production domain. Keeps GH Pages, localhost and the main
            // site all working after checkout.
            $origin = $request->headers->get('Origin');
            $domain = $origin ?: 'https://noterender.denzyl.io';
            $domain = rtrim($domain, '/') . '/';

            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => 'Noterender Export (High Quality)',
                            'description' => 'Export video without watermark in high quality',
                        ],
                        'unit_amount' => 99, // 99 cents
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $domain . '?success=true&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $domain,
            ]);

            return new JsonResponse(['id' => $session->id, 'url' => $session->url]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
