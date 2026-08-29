import { google } from "googleapis";
import { Readable } from "stream";

// Google Drive integration for photos
export async function uploadToDrive(file: File) {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return { error: "Google Drive credentials are not configured in the environment." };
  }

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth });

    // First, check if "DR DHL ELITE FITNESS CLUB" folder exists
    const rootFolderQuery = "name='DR DHL ELITE FITNESS CLUB' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    const rootFolderRes = await drive.files.list({
      q: rootFolderQuery,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    let rootFolderId = rootFolderRes.data.files?.[0]?.id;

    if (!rootFolderId) {
       const folderMetadata = {
         name: 'DR DHL ELITE FITNESS CLUB',
         mimeType: 'application/vnd.google-apps.folder'
       };
       const folder = await drive.files.create({
         requestBody: folderMetadata,
         fields: 'id'
       });
       rootFolderId = folder.data.id;
    }

    // Now, check for "Member Photos" subfolder
    const subFolderQuery = `name='Member Photos' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const subFolderRes = await drive.files.list({
        q: subFolderQuery,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    let subFolderId = subFolderRes.data.files?.[0]?.id;

    if (!subFolderId) {
        const subFolderMetadata = {
            name: 'Member Photos',
            parents: [rootFolderId!],
            mimeType: 'application/vnd.google-apps.folder'
        };
        const subFolder = await drive.files.create({
            requestBody: subFolderMetadata,
            fields: 'id'
        });
        subFolderId = subFolder.data.id;
    }


    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: file.name,
      parents: [subFolderId!]
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return { id: uploadedFile.data.id, url: uploadedFile.data.webViewLink };
  } catch (error: unknown) {
    console.error("Google Drive Upload Error:", error);
    return { error: `Error uploading to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
