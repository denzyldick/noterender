<?php

namespace App\Controller;

use App\Entity\Shoutout;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ShoutoutController extends AbstractController
{
    #[Route('/api/shoutout', name: 'api_shoutout_submit', methods: ['POST'])]
    public function submit(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $clubId = $data['club_id'] ?? null;
        $name = trim($data['name'] ?? '');
        $message = trim($data['message'] ?? '');

        if (!$clubId || !$name || !$message) {
            return new JsonResponse(['error' => 'club_id, name, and message required'], Response::HTTP_BAD_REQUEST);
        }

        $club = $em->getRepository(\App\Entity\User::class)->find($clubId);
        if (!$club) {
            return new JsonResponse(['error' => 'Club not found'], Response::HTTP_NOT_FOUND);
        }

        $shoutout = new Shoutout();
        $shoutout->setClub($club);
        $shoutout->setName($name);
        $shoutout->setMessage($message);

        $em->persist($shoutout);
        $em->flush();

        return new JsonResponse(['id' => $shoutout->getId()], Response::HTTP_CREATED);
    }

    #[Route('/api/shoutout/pending', name: 'api_shoutout_pending', methods: ['GET'])]
    public function pending(EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $shoutouts = $em->getRepository(Shoutout::class)->findBy(
            ['club' => $user, 'status' => Shoutout::STATUS_PENDING],
            ['createdAt' => 'ASC']
        );

        return $this->json(array_map(fn(Shoutout $s) => [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'message' => $s->getMessage(),
            'createdAt' => $s->getCreatedAt()->format('c'),
        ], $shoutouts));
    }

    #[Route('/api/shoutout/{id}/approve', name: 'api_shoutout_approve', methods: ['PUT'])]
    public function approve(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $shoutout = $em->getRepository(Shoutout::class)->findOneBy(['id' => $id, 'club' => $user]);

        if (!$shoutout) {
            return new JsonResponse(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $status = $data['status'] ?? Shoutout::STATUS_APPROVED;
        $shoutout->setStatus($status);
        $em->flush();

        return new JsonResponse(['success' => true]);
    }

    #[Route('/api/shoutout/approved', name: 'api_shoutout_approved', methods: ['GET'])]
    public function approved(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $clubId = $request->query->get('club_id');
        $since = $request->query->get('since');

        if (!$clubId) {
            return new JsonResponse(['error' => 'club_id required'], Response::HTTP_BAD_REQUEST);
        }

        $qb = $em->getRepository(Shoutout::class)->createQueryBuilder('s');
        $qb->where('s.club = :club')->setParameter('club', $clubId)
           ->andWhere('s.status = :status')->setParameter('status', Shoutout::STATUS_APPROVED);

        if ($since) {
            $qb->andWhere('s.createdAt > :since')->setParameter('since', new \DateTimeImmutable($since));
        }

        $qb->orderBy('s.createdAt', 'ASC');

        return $this->json(array_map(fn(Shoutout $s) => [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'message' => $s->getMessage(),
            'createdAt' => $s->getCreatedAt()->format('c'),
        ], $qb->getQuery()->getResult()));
    }
}
