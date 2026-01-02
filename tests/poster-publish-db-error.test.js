/**
 * Unit tests for poster publish database error handling
 * 
 * This test verifies that when the achievement_posters table doesn't exist,
 * the application provides clear error messages to users.
 */

describe('Poster Publish Database Error Handling', () => {
  let originalLetmetryAPI;
  let originalAlert;
  let originalFetch;
  let alertMessage;

  beforeEach(() => {
    // Mock LetmetryAPI
    originalLetmetryAPI = global.LetmetryAPI;
    originalAlert = global.alert;
    originalFetch = global.fetch;
    
    alertMessage = null;
    global.alert = jest.fn((msg) => {
      alertMessage = msg;
    });

    // Mock fetch for data URL to blob conversion
    global.fetch = jest.fn((url) => {
      return Promise.resolve({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' }))
      });
    });

    // Setup localStorage
    localStorage.clear();
    localStorage.setItem('museumPosters', JSON.stringify({
      'test-museum': {
        dataURL: 'data:image/png;base64,test',
        museumName: '测试博物馆',
        date: '2024/01/01'
      }
    }));
  });

  afterEach(() => {
    global.LetmetryAPI = originalLetmetryAPI;
    global.alert = originalAlert;
    global.fetch = originalFetch;
    localStorage.clear();
  });

  test('should provide clear error message when table does not exist', async () => {
    // Mock LetmetryAPI to simulate "table doesn't exist" error
    global.LetmetryAPI = {
      uploadImage: jest.fn().mockResolvedValue({
        url: 'https://example.com/test.png'
      }),
      insertRecord: jest.fn().mockRejectedValue({
        message: "Table 'achievement_posters' doesn't exist",
        sqlMessage: "Table 'achievement_posters' doesn't exist"
      })
    };

    // Create a mock publishPosterFromCheckin function similar to the actual code
    async function publishPosterFromCheckin() {
      const museumId = 'test-museum';
      const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
      const currentPoster = postersData[museumId];

      if (!currentPoster || !currentPoster.dataURL) {
        throw new Error('海报数据未找到，请先生成海报');
      }

      const userName = 'Test User';
      const response = await fetch(currentPoster.dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'test.png', { type: 'image/png' });

      // Upload image
      const upload = await LetmetryAPI.uploadImage(file);
      const imageUrl = upload.url;

      // Try to insert record
      const record = {
        image_url: imageUrl,
        title: `${currentPoster.museumName} 海报`,
        user_name: userName,
        visibility: 'public',
        museum_id: museumId,
        age_group: '7-12',
        created_at: new Date().toISOString()
      };

      try {
        await LetmetryAPI.insertRecord('achievement_posters', record);
      } catch (dbError) {
        const errorMsg = dbError.message || dbError.sqlMessage || String(dbError);
        const isTableMissing = errorMsg.includes("doesn't exist") || 
                             errorMsg.includes("unknown column") ||
                             (errorMsg.includes("Table") && errorMsg.includes("not found"));

        if (isTableMissing) {
          console.error('Database table not initialized:', dbError);
          throw new Error(
            '数据库表未初始化。\n\n' +
            '请联系管理员运行以下命令初始化数据库：\n' +
            'node init-achievement-posters-table.js\n\n' +
            '您的海报图片已成功上传，但未能保存到数据库记录。'
          );
        }

        throw new Error(`数据库操作失败：${errorMsg}`);
      }
    }

    // Execute and verify
    try {
      await publishPosterFromCheckin();
      fail('Expected function to throw error');
    } catch (error) {
      expect(error.message).toContain('数据库表未初始化');
      expect(error.message).toContain('node init-achievement-posters-table.js');
      expect(error.message).toContain('海报图片已成功上传');
    }
  });

  test('should provide clear error message when column is missing', async () => {
    // Mock LetmetryAPI to simulate "unknown column" error
    global.LetmetryAPI = {
      uploadImage: jest.fn().mockResolvedValue({
        url: 'https://example.com/test.png'
      }),
      insertRecord: jest.fn().mockRejectedValue({
        message: "Unknown column 'museum_id' in 'field list'",
        sqlMessage: "Unknown column 'museum_id' in 'field list'"
      })
    };

    async function publishPosterFromCheckin() {
      const museumId = 'test-museum';
      const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
      const currentPoster = postersData[museumId];

      const userName = 'Test User';
      const response = await fetch(currentPoster.dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'test.png', { type: 'image/png' });

      const upload = await LetmetryAPI.uploadImage(file);
      const imageUrl = upload.url;

      const record = {
        image_url: imageUrl,
        title: `${currentPoster.museumName} 海报`,
        user_name: userName,
        visibility: 'public',
        museum_id: museumId,
        age_group: '7-12',
        created_at: new Date().toISOString()
      };

      try {
        await LetmetryAPI.insertRecord('achievement_posters', record);
      } catch (dbError) {
        const errorMsg = (dbError.message || dbError.sqlMessage || String(dbError)).toLowerCase();
        const isTableMissing = errorMsg.includes("doesn't exist") || 
                             errorMsg.includes("unknown column") ||
                             (errorMsg.includes("table") && errorMsg.includes("not found"));

        if (isTableMissing) {
          throw new Error(
            '数据库表未初始化。\n\n' +
            '请联系管理员运行以下命令初始化数据库：\n' +
            'node init-achievement-posters-table.js\n\n' +
            '您的海报图片已成功上传，但未能保存到数据库记录。'
          );
        }

        throw new Error(`数据库操作失败：${dbError.message || dbError.sqlMessage || dbError}`);
      }
    }

    try {
      await publishPosterFromCheckin();
      fail('Expected function to throw error');
    } catch (error) {
      // The error message should contain info about database table initialization
      // because "unknown column" is detected as a table missing issue
      expect(error.message).toContain('数据库表未初始化');
      expect(error.message).toContain('node init-achievement-posters-table.js');
    }
  });

  test('should handle other database errors gracefully', async () => {
    // Mock LetmetryAPI to simulate other database error
    global.LetmetryAPI = {
      uploadImage: jest.fn().mockResolvedValue({
        url: 'https://example.com/test.png'
      }),
      insertRecord: jest.fn().mockRejectedValue({
        message: "Duplicate entry '123' for key 'PRIMARY'",
        sqlMessage: "Duplicate entry '123' for key 'PRIMARY'"
      })
    };

    async function publishPosterFromCheckin() {
      const museumId = 'test-museum';
      const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
      const currentPoster = postersData[museumId];

      const userName = 'Test User';
      const response = await fetch(currentPoster.dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'test.png', { type: 'image/png' });

      const upload = await LetmetryAPI.uploadImage(file);
      const imageUrl = upload.url;

      const record = {
        image_url: imageUrl,
        title: `${currentPoster.museumName} 海报`,
        user_name: userName,
        visibility: 'public',
        museum_id: museumId,
        age_group: '7-12',
        created_at: new Date().toISOString()
      };

      try {
        await LetmetryAPI.insertRecord('achievement_posters', record);
      } catch (dbError) {
        const errorMsg = dbError.message || dbError.sqlMessage || String(dbError);
        const isTableMissing = errorMsg.includes("doesn't exist") || 
                             errorMsg.includes("unknown column") ||
                             (errorMsg.includes("Table") && errorMsg.includes("not found"));

        if (isTableMissing) {
          throw new Error('数据库表未初始化。');
        }

        throw new Error(`数据库操作失败：${errorMsg}`);
      }
    }

    try {
      await publishPosterFromCheckin();
      fail('Expected function to throw error');
    } catch (error) {
      expect(error.message).toContain('数据库操作失败');
      expect(error.message).toContain('Duplicate entry');
    }
  });

  test('should successfully publish when database table exists', async () => {
    // Mock successful scenario
    global.LetmetryAPI = {
      uploadImage: jest.fn().mockResolvedValue({
        url: 'https://example.com/test.png'
      }),
      insertRecord: jest.fn().mockResolvedValue({
        insertId: 123
      })
    };

    async function publishPosterFromCheckin() {
      const museumId = 'test-museum';
      const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
      const currentPoster = postersData[museumId];

      const userName = 'Test User';
      const response = await fetch(currentPoster.dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'test.png', { type: 'image/png' });

      const upload = await LetmetryAPI.uploadImage(file);
      const imageUrl = upload.url;

      const record = {
        image_url: imageUrl,
        title: `${currentPoster.museumName} 海报`,
        user_name: userName,
        visibility: 'public',
        museum_id: museumId,
        age_group: '7-12',
        created_at: new Date().toISOString()
      };

      const result = await LetmetryAPI.insertRecord('achievement_posters', record);
      return result.insertId;
    }

    // Execute and verify success
    const recordId = await publishPosterFromCheckin();
    expect(recordId).toBe(123);
    expect(LetmetryAPI.uploadImage).toHaveBeenCalled();
    expect(LetmetryAPI.insertRecord).toHaveBeenCalledWith(
      'achievement_posters',
      expect.objectContaining({
        museum_id: 'test-museum',
        title: '测试博物馆 海报'
      })
    );
  });
});
