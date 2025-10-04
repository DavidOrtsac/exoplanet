export const uploadUserData = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5002/data/upload_user_data', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in uploadUserData:', error);
    throw error;
  }
};

export const filterData = async (displayTypes) => {
  try {
    const response = await fetch('http://localhost:5002/data/filter_data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ display_types: displayTypes }), // Send as a JSON object
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to filter data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in filterData:', error);
    throw error;
  }
};

export const saveDataset = async (data) => {
  try {
    const response = await fetch('http://localhost:5002/data/save_dataset', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in uploadUserData:', error);
    throw error;
  }
};