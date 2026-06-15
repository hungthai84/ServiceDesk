export { getAccessToken } from './firebase';

export interface GoogleKeepNote {
  name: string;
  title?: string;
  body?: { text: string };
  text?: { text: string };
  list?: { listItems: { text?: { text: string }; checked?: boolean }[] };
  trashed: boolean;
  createTime: string;
  updateTime: string;
}

export const fetchGoogleKeepNotes = async (token: string): Promise<GoogleKeepNote[]> => {
  const response = await fetch('https://keep.googleapis.com/v1/notes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
       throw new Error('Google Keep API is restricted to Google Workspace accounts. Personal @gmail.com accounts are not supported.');
    }
    throw new Error('Failed to fetch Google Keep notes: ' + response.statusText);
  }
  const data = await response.json();
  return data.notes || [];
};

export const createGoogleKeepNote = async (token: string, title?: string, body?: string): Promise<GoogleKeepNote> => {
  const response = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      text: { text: body }
    }),
  });
  if (!response.ok) throw new Error('Failed to create Keep note');
  return response.json();
};

export const deleteGoogleKeepNote = async (token: string, name: string): Promise<void> => {
  const response = await fetch(`https://keep.googleapis.com/v1/${name}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to delete Keep note');
};
