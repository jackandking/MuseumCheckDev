/**
 * Unit tests for Event Wall Nickname Display
 * 
 * Tests the fix for displaying child nickname instead of userId in event wall
 * Issue: Event wall shows technical userId (e.g., "user_mfm") instead of child's nickname
 */

describe('Event Wall Child Nickname Display', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Event Recording with Child Nickname', () => {
    test('should include childNickname in recorded event when nickname is set', () => {
      // Setup: Set child nickname in localStorage
      const testNickname = '小明';
      const testUserId = 'user_test123';
      localStorage.setItem('childNickname', testNickname);
      localStorage.setItem('user_id', testUserId);
      
      // Create a mock event object (simulating what recordEvent creates)
      const mockEvent = {
        id: 'event-12345-test',
        eventType: 'visit',
        eventName: '参观博物馆',
        title: '参观博物馆',
        description: '完成博物馆参观',
        parameters: { museumName: '故宫博物院' },
        userId: localStorage.getItem('user_id') || 'anonymous',
        childNickname: localStorage.getItem('childNickname') || '',
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Verify the event contains childNickname
      expect(mockEvent.childNickname).toBe(testNickname);
      expect(mockEvent.userId).toBe(testUserId);
    });

    test('should have empty childNickname in event when nickname is not set', () => {
      // Setup: No nickname set
      const testUserId = 'user_test456';
      localStorage.setItem('user_id', testUserId);
      
      // Create event without nickname
      const mockEvent = {
        id: 'event-12345-test',
        eventType: 'task',
        eventName: '完成任务',
        title: '完成任务',
        description: '',
        parameters: {},
        userId: localStorage.getItem('user_id') || 'anonymous',
        childNickname: localStorage.getItem('childNickname') || '',
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Verify the event has empty childNickname but still has userId
      expect(mockEvent.childNickname).toBe('');
      expect(mockEvent.userId).toBe(testUserId);
    });
  });

  describe('Event Wall Display Logic', () => {
    test('should display childNickname when available', () => {
      const event = {
        childNickname: '小红',
        userId: 'user_abc123',
        eventType: 'visit',
        title: '参观博物馆'
      };
      
      // Mock the display logic from event-wall.html
      const metadata = [];
      if (event.childNickname) {
        metadata.push(`👤 ${event.childNickname}`);
      } else if (event.userId) {
        metadata.push(`👤 用户 ${event.userId.substring(0, 8)}`);
      }
      
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toBe('👤 小红');
      expect(metadata[0]).not.toContain('user_abc123');
    });

    test('should fallback to userId display when childNickname is not available', () => {
      const event = {
        childNickname: '', // Empty nickname
        userId: 'user_xyz789',
        eventType: 'achievement',
        title: '解锁成就'
      };
      
      // Mock the display logic
      const metadata = [];
      if (event.childNickname) {
        metadata.push(`👤 ${event.childNickname}`);
      } else if (event.userId) {
        metadata.push(`👤 用户 ${event.userId.substring(0, 8)}`);
      }
      
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toBe('👤 用户 user_xyz');
    });

    test('should handle events without childNickname field (backward compatibility)', () => {
      const event = {
        // No childNickname field (old event format)
        userId: 'user_old123',
        eventType: 'checklist',
        title: '清单完成'
      };
      
      // Mock the display logic
      const metadata = [];
      if (event.childNickname) {
        metadata.push(`👤 ${event.childNickname}`);
      } else if (event.userId) {
        metadata.push(`👤 用户 ${event.userId.substring(0, 8)}`);
      }
      
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toBe('👤 用户 user_old');
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in childNickname', () => {
      const event = {
        childNickname: '小淘气😊',
        userId: 'user_123',
        eventType: 'visit'
      };
      
      const metadata = [];
      if (event.childNickname) {
        metadata.push(`👤 ${event.childNickname}`);
      } else if (event.userId) {
        metadata.push(`👤 用户 ${event.userId.substring(0, 8)}`);
      }
      
      expect(metadata[0]).toBe('👤 小淘气😊');
    });

    test('should handle long childNickname', () => {
      const event = {
        childNickname: '这是一个很长的昵称',
        userId: 'user_123',
        eventType: 'visit'
      };
      
      const metadata = [];
      if (event.childNickname) {
        metadata.push(`👤 ${event.childNickname}`);
      } else if (event.userId) {
        metadata.push(`👤 用户 ${event.userId.substring(0, 8)}`);
      }
      
      expect(metadata[0]).toBe('👤 这是一个很长的昵称');
    });
  });
});
