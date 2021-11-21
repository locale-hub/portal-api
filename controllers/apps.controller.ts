import {Request, Response, Router as createRouter} from 'express';

import * as appService from '../logic/services/app.service';
import {validateRequest} from '../logic/middlewares/validateRequest.middleware';
import {createAppSchema} from '../data/requests/createApp.request';
import {sendError} from '../logic/helpers/sendError.helper';
import {sdkAddApp, sdkRemoveApp} from '../logic/services/sdk.service';
import {getAppsFromProject} from '../logic/services/app.service';

const router = createRouter({mergeParams: true});

/**
 * List apps of given project
 */
router.get('/', async function(req: Request, res: Response) {
  try {
    const projectId = req.params.projectId;
    const apps = await appService.getAppsFromProject(projectId);

    res.json({
      applications: apps,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * Create a new app
 */
router.post('/', validateRequest(createAppSchema), async function(req: Request, res: Response) {
  try {
    const projectId = req.params.projectId;
    const appName = req.body.name;
    const appType = req.body.type;
    const appIdentifier = req.body.identifier;

    const app = await appService.createApp(projectId, appName, appType, appIdentifier);

    await sdkAddApp(projectId, app.key);

    res.json({
      application: app,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * Delete a given app
 */
router.delete('/:appId', async function(req: Request, res: Response) {
  try {
    const projectId = req.params.projectId;
    const appId = req.params.appId;

    const app = (await getAppsFromProject(projectId)).find((a) => a.id === appId);
    await appService.deleteApp(projectId, appId);
    await sdkRemoveApp(projectId, app?.key ?? '');

    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
