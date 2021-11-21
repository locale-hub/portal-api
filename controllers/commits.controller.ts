import {Request, Response, Router as createRouter} from 'express';

import * as CommitService from '../logic/services/commit.service';
import {Commit} from '../data/models/commit.model';
import {sendError} from '../logic/helpers/sendError.helper';
import {ErrorCode} from '../data/enums/error-code.enum';
import {updateManifestFromProject} from '../logic/services/manifest.service';
import {ChangeList} from '../data/models/changeList.model';
import {ApiException} from '../data/exceptions/api.exception';
import {sdkUpdatePublishedCommit} from '../logic/services/sdk.service';
import {getCommit} from '../logic/services/commit.service';

const router = createRouter({mergeParams: true});

/**
 * List commits for a given project
 */
router.get(
  '/',
  async function(req: Request, res: Response) {
    try {
      const projectId = req.params.projectId;
      const commits = await CommitService.getCommitsFromProject(projectId);

      res.json({
        commits,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Get details of a given commit
 */
router.get(
  '/:commitId',
  async function(req: Request, res: Response) {
    try {
      const commitId = req.params.commitId;
      const commit = await CommitService.getCommit(commitId);

      res.json({
        commit,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Create a new commit
 */
router.post(
  '/',
  async function(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      const commitTitle: string = req.body.title;
      const commitDescription: string = req.body.description || null;
      const changeList: ChangeList = req.body.changeList;

      await updateManifestFromProject(userId, projectId, changeList, commitTitle, commitDescription);

      res.status(204).send();
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Route to publish/unpublish commit
 */
router.put(
  '/:commitId',
  async function(req: Request, res: Response) {
    try {
      const projectId = req.params.projectId;
      const commitId = req.params.commitId;
      const body: Commit = req.body;

      const commit = await getCommit(commitId);

      if (null === commit) {
        return sendError(res, new ApiException({
          statusCode: 404,
          code: ErrorCode.commitNotFound,
          message: 'Cannot find commit',
        }));
      }

      const success = await CommitService.publish(projectId, commitId, body.deployed);

      if (!success) {
        return sendError(res, new ApiException({
          statusCode: 400,
          code: ErrorCode.commitCannotPublish,
          message: 'Cannot publish commit',
        }));
      }

      await sdkUpdatePublishedCommit(projectId, body.deployed ? commit : undefined);

      res.status(204).send();
    } catch (error) {
      sendError(res, error);
    }
  });

export default router;
