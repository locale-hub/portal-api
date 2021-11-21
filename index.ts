import {app} from './app';
import {dbConnect} from './data/repositories/db.repository';
import {config} from './configs/config';
import {configSchema} from './data/others/config.model';
import {validateObject} from './logic/middlewares/validateObject.middleware';
import {redisConnect} from './data/repositories/redis.service';

const validateConfig = async (): Promise<void> => {
  const isConfigValid = await validateObject(configSchema, config);
  if (!isConfigValid) {
    throw new Error('Configuration is not valid');
  }
};

const validateDbConnection = async (): Promise<void> => {
  const isConnected = await dbConnect();
  if (!isConnected) {
    throw new Error('Connexion failure with the DB.');
  }
};

const validateRedisConnection = async (): Promise<void> => {
  if (!config.features.sdk) {
    return; // feature not enabled
  }

  const isConnected = await redisConnect();
  if (!isConnected) {
    throw new Error('Connexion failure with Redis.');
  }
};

const startApp = async (): Promise<void> => {
  await validateConfig();
  await validateDbConnection();
  await validateRedisConnection();
};

startApp()
  .then(() => {
    const port = config.app.port || 3000;
    app.listen(port, function() {
      console.log(`Portal API is listening on port ${port}!`);
    });
  })
  .catch((error: Error) => {
    console.error('Something wrong happened...');
    console.error(error);
  });
