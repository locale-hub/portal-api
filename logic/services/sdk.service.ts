/**
 * Update SDK Redis with new values
 * @param {string} defaultLocale The default project locale
 * @return {Project|null} The newly created project, null in case of failure
 */
import {SdkPublishedManifest} from '../../data/models/sdkPublishedManifest.model';
import {redisGet, redisRemove, redisSet} from '../../data/repositories/redis.service';
import {Commit} from '../../data/models/commit.model';
import {config} from '../../configs/config';

export const sdkRemoveProject = async (projectId: string): Promise<void> => {
  if (!config.features.sdk) {
    return; // feature not enabled
  }
  await redisRemove(projectId);
};

export const sdkUpdatePublishedCommit = async (projectId: string, commit?: Commit): Promise<void> => {
  if (!config.features.sdk) {
    return; // feature not enabled
  }
  const data: SdkPublishedManifest = await redisGet<SdkPublishedManifest>(projectId) ?? {};

  data.commitId = commit?.id ?? undefined;
  data.commit = commit?.changeList ?? undefined;

  await redisSet(projectId, data);
};

export const sdkAddApp = async (projectId: string, subscriptionKey: string): Promise<void> => {
  if (!config.features.sdk) {
    return; // feature not enabled
  }
  const data: SdkPublishedManifest = await redisGet<SdkPublishedManifest>(projectId) ?? {};

  if (undefined === data.subscriptionKeys) {
    data.subscriptionKeys = [];
  }

  data.subscriptionKeys.push(subscriptionKey);

  await redisSet(projectId, data);
};

export const sdkRemoveApp = async (projectId: string, subscriptionKey: string): Promise<void> => {
  if (!config.features.sdk) {
    return; // feature not enabled
  }
  const data: SdkPublishedManifest = await redisGet<SdkPublishedManifest>(projectId) ?? {};

  if (undefined === data.subscriptionKeys) {
    data.subscriptionKeys = [];
  }

  data.subscriptionKeys = data.subscriptionKeys.filter((sk) => sk !== subscriptionKey);

  await redisSet(projectId, data);
};


export const sdkChangeDefaultLocale = async (projectId: string, defaultLocale: string): Promise<void> => {
  if (!config.features.sdk) {
    return; // feature not enabled
  }
  const data: SdkPublishedManifest = await redisGet<SdkPublishedManifest>(projectId) ?? {};

  data.defaultLocale = defaultLocale;

  await redisSet(projectId, data);
};
