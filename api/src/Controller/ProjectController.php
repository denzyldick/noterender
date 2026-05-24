<?php

namespace App\Controller;

use App\Entity\Project;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ProjectController extends AbstractController
{
    #[Route('/api/projects', name: 'api_projects_list', methods: ['GET'])]
    public function index(EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $projects = $em->getRepository(Project::class)->findBy(['user' => $user], ['updatedAt' => 'DESC']);

        return $this->json(array_map(fn(Project $p) => [
            'id' => $p->getId(),
            'name' => $p->getName(),
            'data' => json_decode($p->getData(), true),
            'createdAt' => $p->getCreatedAt()->format('c'),
            'updatedAt' => $p->getUpdatedAt()?->format('c'),
        ], $projects));
    }

    #[Route('/api/projects', name: 'api_projects_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        $project = new Project();
        $project->setUser($user);
        $project->setName($data['name'] ?? 'Untitled');
        $project->setData(json_encode($data['data'] ?? []));
        $project->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($project);
        $em->flush();

        return new JsonResponse(['id' => $project->getId()], Response::HTTP_CREATED);
    }

    #[Route('/api/projects/{id}', name: 'api_projects_update', methods: ['PUT'])]
    public function update(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $project = $em->getRepository(Project::class)->findOneBy(['id' => $id, 'user' => $user]);

        if (!$project) {
            return new JsonResponse(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['name'])) $project->setName($data['name']);
        if (isset($data['data'])) $project->setData(json_encode($data['data']));
        $project->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return new JsonResponse(['success' => true]);
    }

    #[Route('/api/projects/{id}', name: 'api_projects_delete', methods: ['DELETE'])]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $project = $em->getRepository(Project::class)->findOneBy(['id' => $id, 'user' => $user]);

        if (!$project) {
            return new JsonResponse(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $em->remove($project);
        $em->flush();

        return new JsonResponse(['success' => true]);
    }
}
