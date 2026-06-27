import { getAccessToken } from '../firebase';

const DB_FILE_NAME = 'app_database.json';

export const backupDatabaseToDrive = async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('No access token available');

    // Collect all localStorage data
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            data[key] = localStorage.getItem(key) || '';
        }
    }

    // Check if file already exists
    const query = encodeURIComponent(`name='${DB_FILE_NAME}' and trashed=false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!searchRes.ok) throw new Error('Failed to search for existing database');
    const searchData = await searchRes.json();
    
    const fileContent = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    if (searchData.files && searchData.files.length > 0) {
        // Update existing file
        const fileId = searchData.files[0].id;
        const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: fileContent
        });
        if (!updateRes.ok) throw new Error('Failed to update database file');
        return await updateRes.json();
    } else {
        // Create new file
        const metadata = {
            name: DB_FILE_NAME,
            mimeType: 'application/json',
            parents: ['1O-LaLAA7FNrIzMKGwyxHCdlIKh_W4htY']
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileContent);

        const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
        });
        if (!createRes.ok) throw new Error('Failed to create database file');
        return await createRes.json();
    }
};

export const restoreDatabaseFromDrive = async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('No access token available');

    const query = encodeURIComponent(`name='${DB_FILE_NAME}' and trashed=false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!searchRes.ok) throw new Error('Failed to search for existing database');
    const searchData = await searchRes.json();
    
    if (!searchData.files || searchData.files.length === 0) {
        throw new Error('Không tìm thấy tệp cơ sở dữ liệu trên Drive.');
    }
    
    const fileId = searchData.files[0].id;
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!downloadRes.ok) throw new Error('Failed to download database file');
    
    const data = await downloadRes.json();
    
    // Restore to localStorage
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            localStorage.setItem(key, data[key]);
        }
    }
    
    return true;
};
