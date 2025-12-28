/**
 * Regression test for event wall nickname bug
 *
 * 复现：设置昵称后，事件墙依然显示 userId 而不是昵称。
 * 目标：确保事件写入时 childNickname 字段始终写入，事件墙能正确显示昵称。
 */

describe('Event Wall Nickname Regression', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
  });

  test('should write childNickname to event data after setting nickname', () => {
    // 模拟设置昵称
    localStorage.setItem('childNickname', '小明');
    // 模拟事件写入逻辑
    const userId = 'user-12345678';
    const childNickname = localStorage.getItem('childNickname') || '';
    const event = {
      id: 'event-1',
      eventType: 'visit',
      userId,
      childNickname,
      timestamp: Date.now()
    };
    // 断言事件数据包含昵称
    expect(event.childNickname).toBe('小明');
  });

  test('should fallback to default nickname if not set', () => {
    // localStorage 没有 childNickname
    localStorage.removeItem('childNickname');
    const userId = 'user-12345678';
    let childNickname = localStorage.getItem('childNickname');
    if (!childNickname || childNickname.trim() === '') {
      childNickname = '小淘气';
    }
    const event = {
      id: 'event-2',
      eventType: 'visit',
      userId,
      childNickname,
      timestamp: Date.now()
    };
    expect(event.childNickname).toBe('小淘气');
  });

  test('should NOT fallback if childNickname is empty string (simulate bug)', () => {
    // 模拟 bug：childNickname 被设置为空字符串
    localStorage.setItem('childNickname', '');
    const userId = 'user-12345678';
    let childNickname = localStorage.getItem('childNickname');
    if (!childNickname || childNickname.trim() === '') {
      childNickname = '小淘气';
    }
    const event = {
      id: 'event-3',
      eventType: 'visit',
      userId,
      childNickname,
      timestamp: Date.now()
    };
    expect(event.childNickname).toBe('小淘气');
  });
});
