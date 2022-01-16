import {Request, Response, Router as createRouter} from 'express';

import {UserRepository} from '../data/repositories/user.repository';
import {sendError} from '../logic/helpers/sendError.helper';


const router = createRouter({mergeParams: true});
const userRepository = new UserRepository();

/**
 * Edit current users information
 */
router.get(
  '/:userId', async function(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const user = await userRepository.find(userId);

      delete user.emails;
      delete user.passwordSalt;
      delete user.password;

      res.json({
        user,
      });
    } catch (error) {
      sendError(res, error);
    }
  });


export default router;
