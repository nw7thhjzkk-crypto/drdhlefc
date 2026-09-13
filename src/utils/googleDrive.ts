
// Google Drive integration for photos

interface DriveResult {
  url: string;
  id: string;
}

export async function uploadToDrive(file: File): Promise<DriveResult | null> {
  const configured =
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!configured) {
    return null;
  }

  // TODO: implement real Google Drive upload using the OAuth2 credentials
  void file;
  throw new Error("Google Drive upload not yet implemented");
}
