import {Request, Response, Router as createRouter} from 'express';

import {
  deleteOrganization,
  getOrganization, getOrganizationApiUsage,
  getOrganizationProjects,
  getOrganizationStorageUsage,
  putOrganization,
} from '../logic/services/organization.service';
import {OrganizationRepository} from '../data/repositories/organization.repository';
import {sendError} from '../logic/helpers/sendError.helper';
import {ErrorCode} from '../data/enums/error-code.enum';
import {v4 as uuid} from 'uuid';
import {validateRequest} from '../logic/middlewares/validateRequest.middleware';
import {createOrgSchema} from '../data/requests/createOrg.request';
import {validateUserAccessToOrg} from '../logic/middlewares/validateUserAccessToOrg.middleware';
import {ApiException} from '../data/exceptions/api.exception';
import {getProjectsTranslationProgress} from '../logic/services/project.service';

const router = createRouter({mergeParams: true});
const organizationRepository = new OrganizationRepository();

/**
 * Create organization
 */
router.post(
  '/',
  validateRequest(createOrgSchema),
  async function(req: Request, res: Response) {
    try {
      const user = req.user;
      const organizationName = req.body.organization.name;

      const organization = await organizationRepository.insert(
        uuid(), // orgId
        user.id,
        organizationName,
      );

      res.json({
        organization,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Get organization information
 */
router.get(
  '/:organizationId',
  validateUserAccessToOrg,
  async function(req: Request, res: Response) {
    try {
      const organization = await getOrganization(req.params.organizationId);

      res.json({
        organization,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Update organization information
 */
router.put(
  '/:organizationId',
  validateUserAccessToOrg,
  async function(req: Request, res: Response) {
    try {
      const organizationId = req.params.organizationId;
      const organization = await organizationRepository.find(organizationId);

      // validate authenticated user is owner
      if (organization.owner !== req.user.id) {
        return sendError(res, new ApiException({
          statusCode: 403,
          code: ErrorCode.organizationActionRequiresOwnerAccess,
          message: 'Only the owner can edit organization information',
        }));
      }

      await putOrganization(req.body);

      res.status(204).send();
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Delete an organization
 */
router.delete(
  '/:organizationId',
  validateUserAccessToOrg,
  async function(req: Request, res: Response) {
    try {
      await deleteOrganization(req.params.organizationId);

      res.status(204).json();
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * List projects for a given organization
 */
router.get(
  '/:organizationId/projects',
  validateUserAccessToOrg,
  async function(req: Request, res: Response) {
    try {
      const projects = await getOrganizationProjects([req.params.organizationId]);

      const progress = await getProjectsTranslationProgress(projects.map((project) => project.id));

      res.json({
        projects,
        progress,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Get organization's usage data
 */
router.get(
  '/:organizationId/usage',
  validateUserAccessToOrg,
  async function(req: Request, res: Response) {
    try {
      const storageUsage = await getOrganizationStorageUsage(req.params.organizationId);
      const apiUsage = await getOrganizationApiUsage(req.params.organizationId);

      res.json({
        usage: {
          storage: storageUsage,
          api: apiUsage,
        },
      });
    } catch (error) {
      sendError(res, error);
    }
  });

export default router;
