import { FileMetadata, SessionData } from './types';

export type CloudUpload =
  | { provider: 'supabase'; slots: Record<string, string> }
  | { provider?: 'firebase'; customToken: string; config: { apiKey: string; authDomain: string; projectId: string; storageBucket: string } };

export async function uploadCloud(session: SessionData, files: FileMetadata[], upload: CloudUpload, progress?: (percent: number) => void) {
  if ('provider' in upload && upload.provider === 'supabase') {
    let completed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i].file;
      if (!file) throw new Error('Please select your files again.');
      const uploadUrl = upload.slots[session.files[i].fileId];
      if (!uploadUrl) throw new Error('Upload slot missing.');

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', files[i].type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            progress?.(Math.round(((completed + e.loaded) / session.totalSizeBytes) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network connection error during file upload.'));
        xhr.send(file);
      });
      completed += file.size;
    }
    return;
  }

  // Firebase fallback
  const { initializeApp, deleteApp } = await import('firebase/app');
  const { initializeAuth, inMemoryPersistence, signInWithCustomToken, signOut } = await import('firebase/auth');
  const { getStorage, ref, uploadBytesResumable } = await import('firebase/storage');

  const fbUpload = upload as { customToken: string; config: { apiKey: string; authDomain: string; projectId: string; storageBucket: string } };
  const app = initializeApp(fbUpload.config, session.id);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  try {
    await signInWithCustomToken(auth, fbUpload.customToken);
    const storage = getStorage(app);
    let completed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i].file;
      if (!file) throw new Error('Please select your files again.');
      const task = uploadBytesResumable(ref(storage, `sessions/${session.id}/${session.files[i].fileId}`), file, { contentType: files[i].type, cacheControl: 'no-store' });
      await new Promise<void>((resolve, reject) => task.on('state_changed', state => progress?.(Math.round((completed + state.bytesTransferred) / session.totalSizeBytes * 100)), reject, resolve));
      completed += file.size;
    }
  } finally {
    await signOut(auth).catch(() => {});
    await deleteApp(app);
  }
}
