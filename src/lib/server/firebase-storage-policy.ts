type MetadataWritableFile = {
  setMetadata(metadata: { cacheControl: 'no-store' }): Promise<unknown>;
};

// Storage Rules cannot inspect Cache-Control system metadata. Normalize uploads
// through the Admin SDK after sealing the upload grant and before activation.
export async function enforceNoStore(file: MetadataWritableFile): Promise<void> {
  await file.setMetadata({ cacheControl: 'no-store' });
}
