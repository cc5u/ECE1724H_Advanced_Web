import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

export const createSpacesClient = () =>
  new S3Client({
    endpoint: "https://tor1.digitaloceanspaces.com",
    region: "tor1",
    credentials: {
      accessKeyId: process.env.SPACES_KEY || "",
      secretAccessKey: process.env.SPACES_SECRET || "",
    },
  });

export const getSpacesBucket = () => process.env.SPACES_BUCKET || "";

export async function deleteSpaceObjectsByPrefix(prefix: string) {
  const s3Client = createSpacesClient();
  const bucket = getSpacesBucket();
  const objectsToDelete: { Key: string }[] = [];
  let continuationToken: string | undefined;

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const matchingObjects =
      listResponse.Contents?.map((object) => ({
        Key: object.Key as string,
      })) ?? [];

    objectsToDelete.push(...matchingObjects);
    continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
  } while (continuationToken);

  if (objectsToDelete.length === 0) {
    return 0;
  }

  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objectsToDelete,
      },
    })
  );

  return objectsToDelete.length;
}

export async function deleteUserSpaceObjectsByFragment(userId: string, fragment: string) {
  const s3Client = createSpacesClient();
  const bucket = getSpacesBucket();
  const userPrefix = `users/${userId}/`;
  const objectsToDelete: { Key: string }[] = [];
  let continuationToken: string | undefined;

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: userPrefix,
        ContinuationToken: continuationToken,
      })
    );

    const matchingObjects =
      listResponse.Contents?.filter((object) => object.Key?.includes(fragment)).map((object) => ({
        Key: object.Key as string,
      })) ?? [];

    objectsToDelete.push(...matchingObjects);
    continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
  } while (continuationToken);

  if (objectsToDelete.length === 0) {
    return 0;
  }

  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objectsToDelete,
      },
    })
  );

  return objectsToDelete.length;
}
