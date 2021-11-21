import {Request, Response, Router as createRouter} from 'express';
import {createProject, deleteProject, getProject, updateProject} from '../logic/services/project.service';
import {getOrganization, getOrganizationProjects} from '../logic/services/organization.service';
import {validateRequest} from '../logic/middlewares/validateRequest.middleware';
import {createProjectSchema} from '../data/requests/createProject.request';
import {updateProjectSchema} from '../data/requests/updateProject.request';
import {sendError} from '../logic/helpers/sendError.helper';
import {validateUserAccessToProject} from '../logic/middlewares/validateUserAccessToProject.middleware';
import {User} from '../data/models/user.model';
import {getCommitsFromProject} from '../logic/services/commit.service';
import {sdkChangeDefaultLocale, sdkRemoveProject} from '../logic/services/sdk.service';
import {ApiException} from '../data/exceptions/api.exception';
import {ErrorCode} from '../data/enums/error-code.enum';

const router = createRouter({mergeParams: true});

/**
 * List projects of the current user
 */
router.get('/', async function(req: Request, res: Response) {
  const user = req.user as User;
  const projects = (await getOrganizationProjects([req.user.organizationId]))
    .filter((project) => project.users.map((u) => u.id).includes(user.id));

  res.json({
    projects,
  });
});

/**
 * Create a new project
 */
router.post('/', validateRequest(createProjectSchema), async function(req: Request, res: Response) {
  const defaultLocale: string = req.body.defaultLocale || 'en';
  const organizationId = req.body.organizationId;
  const name = req.body.name;

  const organization = await getOrganization(organizationId);

  if (null === organization) {
    return sendError(res, new ApiException({
      statusCode: 404,
      code: ErrorCode.organizationNotFound,
      message: 'Could not find organization',
    }));
  }

  const project = await createProject(name, organizationId, req.user, defaultLocale);

  if (null === project) {
    return sendError(res, new ApiException({
      statusCode: 500,
      code: ErrorCode.projectCannotCreate,
      message: 'Could not create project',
    }));
  }

  await sdkChangeDefaultLocale(project.id, defaultLocale);

  res.json({
    project,
  });
});

/**
 * Get project information
 */
router.get('/:projectId', validateUserAccessToProject, async function(req: Request, res: Response) {
  try {
    const projectId: string = req.params.projectId;
    const project = await getProject(projectId);

    const commits = await getCommitsFromProject(projectId);

    // Deployed commit information
    const deployedCommitSearch = commits.filter((c) => c.deployed)[0] ?? null;
    const deployedCommit = null === deployedCommitSearch ? null : {
      id: deployedCommitSearch.id,
      authorId: deployedCommitSearch.authorId,
      title: deployedCommitSearch.title,
      description: deployedCommitSearch.description,
      createdAt: deployedCommitSearch.createdAt,
    };

    // Get translation progress
    const latestCommitSearch = commits[commits.length - 1] ?? null;
    const progress: { [key: string]: number } = {};
    if (null !== latestCommitSearch) {
      const totalKeys = latestCommitSearch.changeList.keys.length;
      latestCommitSearch.changeList.locales.forEach((locale) => {
        const manifest = latestCommitSearch.changeList.manifest[locale];
        const translatedKeys = Object.keys(manifest)
          .filter((k) => null !== manifest[k] && 0 !== manifest[k].trim().length)
          .length;
        const rawPercent = translatedKeys / totalKeys;
        progress[locale] = Math.round((rawPercent + Number.EPSILON) * 100) / 100;
      });
    }

    res.json({
      project,
      deployedCommit,
      progress: 0 !== Object.keys(progress).length ? progress : null,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * Edit project information
 */
router.put('/:projectId', validateUserAccessToProject, validateRequest(updateProjectSchema),
  async function(req: Request, res: Response) {
    try {
      const projectId: string = req.params.projectId;
      const project = await getProject(projectId);

      if (null !== req.body.name) {
        project.name = req.body.name;
      } if (null !== req.body.userId) {
        project.userId = req.body.userId;
      } if (null !== req.body.defaultLocale) {
        project.defaultLocale = req.body.defaultLocale;
        await sdkChangeDefaultLocale(project.id, req.body.defaultLocale);
      } if (null !== req.body.archived) {
        project.archived = req.body.archived;
      }

      await updateProject(projectId, project);

      res.status(204).json();
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Delete a project
 */
router.delete('/:projectId', validateUserAccessToProject, async function(req: Request, res: Response) {
  const projectId: string = req.params.projectId;

  await deleteProject(projectId);
  await sdkRemoveProject(projectId);

  res.status(204).send();
});

export default router;
