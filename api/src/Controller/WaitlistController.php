<?php

namespace App\Controller;

use App\Entity\WaitlistEntry;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class WaitlistController extends AbstractController
{
    #[Route('/api/waitlist', name: 'api_waitlist', methods: ['POST'])]
    public function submit(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Invalid email address'], 400);
        }

        // Check if already exists
        $existing = $em->getRepository(WaitlistEntry::class)->findOneBy(['email' => $email]);
        if ($existing) {
            return new JsonResponse(['success' => true, 'message' => 'Already on waitlist']);
        }

        $entry = new WaitlistEntry();
        $entry->setEmail($email);

        $em->persist($entry);
        $em->flush();

        return new JsonResponse(['success' => true]);
    }
}
