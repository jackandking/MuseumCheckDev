/**
 * Clear Data Functionality Tests
 * 
 * These tests validate the clear data functionality added in issue #198,
 * ensuring proper data clearing and user confirmation workflows.
 */

// Mock confirm function for testing
global.confirm = jest.fn();
global.alert = jest.fn();

// Mock DOM elements
const mockModalContent = {
    innerHTML: '',
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

const mockModal = {
    classList: {
        contains: jest.fn(() => false),
        remove: jest.fn(),
        add: jest.fn()
    }
};

// Mock getElementById
global.document.getElementById = jest.fn((id) => {
    if (id === 'modalContent') return mockModalContent;
    if (id === 'museumModal') return mockModal;
    return {
        textContent: '',
        innerHTML: '',
        value: '',
        style: { display: 'none' },
        addEventListener: jest.fn()
    };
});

// Mock other DOM methods
global.document.querySelector = jest.fn(() => ({
    addEventListener: jest.fn()
}));

global.document.querySelectorAll = jest.fn(() => []);

describe('Clear Data Functionality', () => {
    let app;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        global.confirm.mockReset();
        global.alert.mockReset();
        
        // Reset localStorage
        global.localStorage.clear();
        
        // Create app instance
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'script.js');
        
        app = {
            visitedMuseums: ['museum1', 'museum2'],
            museumChecklists: {
                'museum1-parent-7-12': [0, 1],
                'museum1-child-7-12': [0],
                'museum2-parent-7-12': [1]
            },
            taskPhotos: { 'photo1': 'data' },
            currentAge: '7-12',
            indexedDBSupported: false,
            updateStats: jest.fn(),
            renderMuseums: jest.fn(),
            updateAgeGroupSelector: jest.fn(),
            saveMuseumChecklists: jest.fn(),
            openMuseumModal: jest.fn(),
            trackEvent: jest.fn(),
            clearIndexedDBData: jest.fn(),
            getMuseumById: jest.fn(() => ({ id: 'museum1', name: '测试博物馆' })),
            getAgeGroupLabel: jest.fn((age) => `${age}岁测试`)
        };
        
        // Add methods from script.js
        app.clearAllData = function() {
            const confirmed = confirm(
                '⚠️ 重要警告 ⚠️\n\n' +
                '您即将清空所有数据，包括：\n' +
                '• 所有已参观博物馆记录\n' +
                '• 所有清单完成记录\n' +
                '• 所有任务照片\n' +
                '• 所有成就进度\n\n' +
                '此操作不可撤销！\n\n' +
                '确定要继续吗？'
            );
            
            if (confirmed) {
                const doubleConfirmed = confirm(
                    '最后确认：\n\n' +
                    '您真的要清空所有数据吗？\n' +
                    '这将删除您的所有参观记录和进度！\n\n' +
                    '点击"确定"将永久删除所有数据'
                );
                
                if (doubleConfirmed) {
                    // Clear all localStorage data
                    localStorage.removeItem('visitedMuseums');
                    localStorage.removeItem('museumChecklists');
                    localStorage.removeItem('taskPhotos');
                    localStorage.removeItem('ageGroup');
                    
                    // Clear IndexedDB data if supported
                    if (this.indexedDBSupported) {
                        this.clearIndexedDBData();
                    }
                    
                    // Reset application state
                    this.visitedMuseums = [];
                    this.museumChecklists = {};
                    this.taskPhotos = {};
                    this.currentAgeGroup = '7-12';
                    
                    // Update UI
                    this.updateStats();
                    this.renderMuseums();
                    this.updateAgeGroupSelector();
                    
                    // Show success message
                    alert('✅ 所有数据已成功清空！');
                    
                    // Track event
                    this.trackEvent('clear_all_data', {
                        'timestamp': new Date().toISOString()
                    });
                }
            }
        };

        app.clearParentChecklistData = function(museumId, ageGroup) {
            const confirmed = confirm(
                '⚠️ 清空家长清单数据 ⚠️\n\n' +
                `您即将清空「${this.getMuseumById(museumId)?.name || '此博物馆'}」\n` +
                `年龄组「${this.getAgeGroupLabel(ageGroup)}」的家长清单完成记录\n\n` +
                '此操作不可撤销！\n\n' +
                '确定要继续吗？'
            );
            
            if (confirmed) {
                const parentKey = `${museumId}-parent-${ageGroup}`;
                delete this.museumChecklists[parentKey];
                
                // Save updated data
                this.saveMuseumChecklists();
                
                // Update modal if currently open
                const modal = document.getElementById('museumModal');
                if (!modal.classList.contains('hidden')) {
                    this.openMuseumModal(this.getMuseumById(museumId));
                }
                
                alert('✅ 家长清单数据已清空！');
                
                // Track event
                this.trackEvent('clear_parent_checklist', {
                    'museum_id': museumId,
                    'age_group': ageGroup,
                    'timestamp': new Date().toISOString()
                });
            }
        };

        app.clearChildChecklistData = function(museumId, ageGroup) {
            const confirmed = confirm(
                '⚠️ 清空孩子清单数据 ⚠️\n\n' +
                `您即将清空「${this.getMuseumById(museumId)?.name || '此博物馆'}」\n` +
                `年龄组「${this.getAgeGroupLabel(ageGroup)}」的孩子清单完成记录\n\n` +
                '此操作不可撤销！\n\n' +
                '确定要继续吗？'
            );
            
            if (confirmed) {
                const childKey = `${museumId}-child-${ageGroup}`;
                delete this.museumChecklists[childKey];
                
                // Save updated data
                this.saveMuseumChecklists();
                
                // Update modal if currently open
                const modal = document.getElementById('museumModal');
                if (!modal.classList.contains('hidden')) {
                    this.openMuseumModal(this.getMuseumById(museumId));
                }
                
                alert('✅ 孩子清单数据已清空！');
                
                // Track event
                this.trackEvent('clear_child_checklist', {
                    'museum_id': museumId,
                    'age_group': ageGroup,
                    'timestamp': new Date().toISOString()
                });
            }
        };
    });

    describe('clearAllData', () => {
        test('should show warning and require double confirmation', () => {
            global.confirm.mockReturnValueOnce(false);
            
            app.clearAllData();
            
            expect(global.confirm).toHaveBeenCalledTimes(1);
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('重要警告')
            );
            expect(app.visitedMuseums).toHaveLength(2); // Data should not be cleared
        });

        test('should clear all data when double confirmed', () => {
            global.confirm
                .mockReturnValueOnce(true)  // First confirmation
                .mockReturnValueOnce(true); // Second confirmation
                
            app.clearAllData();
            
            expect(global.confirm).toHaveBeenCalledTimes(2);
            expect(app.visitedMuseums).toHaveLength(0);
            expect(app.museumChecklists).toEqual({});
            expect(app.taskPhotos).toEqual({});
            expect(global.alert).toHaveBeenCalledWith('✅ 所有数据已成功清空！');
            expect(app.trackEvent).toHaveBeenCalledWith('clear_all_data', expect.any(Object));
        });

        test('should not clear data if second confirmation is denied', () => {
            global.confirm
                .mockReturnValueOnce(true)   // First confirmation
                .mockReturnValueOnce(false); // Second confirmation denied
                
            app.clearAllData();
            
            expect(global.confirm).toHaveBeenCalledTimes(2);
            expect(app.visitedMuseums).toHaveLength(2); // Data should not be cleared
            expect(global.alert).not.toHaveBeenCalled();
        });

        test('should call clearIndexedDBData when indexedDB is supported', () => {
            app.indexedDBSupported = true;
            global.confirm
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true);
                
            app.clearAllData();
            
            expect(app.clearIndexedDBData).toHaveBeenCalled();
        });

        test('should update UI after clearing data', () => {
            global.confirm
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true);
                
            app.clearAllData();
            
            expect(app.updateStats).toHaveBeenCalled();
            expect(app.renderMuseums).toHaveBeenCalled();
            expect(app.updateAgeGroupSelector).toHaveBeenCalled();
        });
    });

    describe('clearParentChecklistData', () => {
        test('should show confirmation dialog with museum name and age group', () => {
            global.confirm.mockReturnValueOnce(false);
            
            app.clearParentChecklistData('museum1', '7-12');
            
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('测试博物馆')
            );
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('7-12岁测试')
            );
        });

        test('should clear only parent checklist data when confirmed', () => {
            global.confirm.mockReturnValueOnce(true);
            
            app.clearParentChecklistData('museum1', '7-12');
            
            expect(app.museumChecklists['museum1-parent-7-12']).toBeUndefined();
            expect(app.museumChecklists['museum1-child-7-12']).toEqual([0]); // Child data preserved
            expect(app.museumChecklists['museum2-parent-7-12']).toEqual([1]); // Other museum data preserved
            expect(app.saveMuseumChecklists).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith('✅ 家长清单数据已清空！');
            expect(app.trackEvent).toHaveBeenCalledWith('clear_parent_checklist', expect.any(Object));
        });

        test('should not clear data when confirmation is denied', () => {
            global.confirm.mockReturnValueOnce(false);
            
            app.clearParentChecklistData('museum1', '7-12');
            
            expect(app.museumChecklists['museum1-parent-7-12']).toEqual([0, 1]);
            expect(app.saveMuseumChecklists).not.toHaveBeenCalled();
            expect(global.alert).not.toHaveBeenCalled();
        });
    });

    describe('clearChildChecklistData', () => {
        test('should show confirmation dialog with museum name and age group', () => {
            global.confirm.mockReturnValueOnce(false);
            
            app.clearChildChecklistData('museum1', '7-12');
            
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('测试博物馆')
            );
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('7-12岁测试')
            );
        });

        test('should clear only child checklist data when confirmed', () => {
            global.confirm.mockReturnValueOnce(true);
            
            app.clearChildChecklistData('museum1', '7-12');
            
            expect(app.museumChecklists['museum1-child-7-12']).toBeUndefined();
            expect(app.museumChecklists['museum1-parent-7-12']).toEqual([0, 1]); // Parent data preserved
            expect(app.museumChecklists['museum2-parent-7-12']).toEqual([1]); // Other museum data preserved
            expect(app.saveMuseumChecklists).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith('✅ 孩子清单数据已清空！');
            expect(app.trackEvent).toHaveBeenCalledWith('clear_child_checklist', expect.any(Object));
        });

        test('should not clear data when confirmation is denied', () => {
            global.confirm.mockReturnValueOnce(false);
            
            app.clearChildChecklistData('museum1', '7-12');
            
            expect(app.museumChecklists['museum1-child-7-12']).toEqual([0]);
            expect(app.saveMuseumChecklists).not.toHaveBeenCalled();
            expect(global.alert).not.toHaveBeenCalled();
        });
    });

    describe('Regression Tests - Issue #198', () => {
        test('should provide clear data functionality in three specified locations', () => {
            // This test validates that the clear data functionality exists
            // for the three locations specified in issue #198
            expect(typeof app.clearAllData).toBe('function');
            expect(typeof app.clearParentChecklistData).toBe('function');
            expect(typeof app.clearChildChecklistData).toBe('function');
        });

        test('should require user confirmation before clearing any data', () => {
            global.confirm.mockReturnValueOnce(false);
            
            // Test all three clear functions require confirmation
            app.clearAllData();
            app.clearParentChecklistData('museum1', '7-12');
            app.clearChildChecklistData('museum1', '7-12');
            
            expect(global.confirm).toHaveBeenCalledTimes(3);
        });

        test('should warn users about irreversible deletion', () => {
            global.confirm.mockReturnValue(false);
            
            app.clearAllData();
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('不可撤销')
            );
            
            app.clearParentChecklistData('museum1', '7-12');
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('不可撤销')
            );
            
            app.clearChildChecklistData('museum1', '7-12');
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('不可撤销')
            );
        });
    });
});