/**
 * Leaderboard Page JavaScript
 * 独立排行榜页面的核心逻辑
 * 
 * Features:
 * - Tab switching (museums/pets)
 * - Data loading with fallback
 * - User stats display
 * - Responsive design
 * - Pull-to-refresh support
 */

(function() {
    'use strict';

    // Tab configuration: each tab renders the same underlying data differently
    const TAB_CONFIG = {
        pet: {
            icon: '🐾',
            introTitle: '宠物年龄排行榜',
            introDesc: '打卡的博物馆越多，宠物越大！看看谁的宠物最年长！',
            scoreLabel: '宠物年龄'
        },
        museum: {
            icon: '🏛️',
            introTitle: '打卡博物馆排行榜',
            introDesc: '看看谁打卡过的博物馆最多！坚持打卡，冲上榜首！',
            scoreLabel: '打卡数量'
        }
    };

    // Leaderboard Page Manager
    window.LeaderboardPage = {
        currentTab: 'pet',
        currentPage: 1,
        isLoading: false,
        hasMoreData: true,
        allData: [],

        // Initialize the page
        init: function() {
            console.log('[LeaderboardPage] Initializing...');
            this.bindEvents();
            this.loadInitialData();
            this.initializePullToRefresh();
            console.log('[LeaderboardPage] Initialized');
        },

        // Bind event listeners
        bindEvents: function() {
            // Back button
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.goBack());
            }

            // Refresh button
            const refreshBtn = document.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refreshLeaderboard());
            }

            // Load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => this.loadMoreData());
            }

            // Page visibility change
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.refreshData();
                }
            });

            // Handle browser back button
            window.addEventListener('popstate', (e) => {
                if (e.state === null) {
                    this.goBack();
                }
            });
        },

        // Switch between tabs (pet / museum)
        switchTab: function(rankingType) {
            if (this.isLoading) return;
            if (!TAB_CONFIG[rankingType] || rankingType === this.currentTab) return;

            // Update current tab
            this.currentTab = rankingType;

            // Update tab button states
            const tabPet = document.getElementById('tabBtnPet');
            const tabMuseum = document.getElementById('tabBtnMuseum');
            if (tabPet) tabPet.classList.toggle('active', rankingType === 'pet');
            if (tabMuseum) tabMuseum.classList.toggle('active', rankingType === 'museum');

            // Update intro text and re-render from already-loaded data (no refetch needed)
            this.updateIntroText(rankingType);
            if (this.allData.length > 0) {
                this.renderLeaderboard(this.allData);
                this.updateUserStats(this.getCurrentUserStats(this.allData));
            }
        },

        // Update introduction text based on tab
        updateIntroText: function(rankingType) {
            const config = TAB_CONFIG[rankingType] || TAB_CONFIG.pet;
            const introTitle = document.querySelector('.intro-title');
            const introDesc = document.querySelector('.intro-desc');
            const scoreLabel = document.getElementById('scoreLabel');

            if (introTitle) introTitle.innerHTML = `<span class="title-icon">${config.icon}</span>${config.introTitle}`;
            if (introDesc) introDesc.textContent = config.introDesc;
            if (scoreLabel) scoreLabel.textContent = config.scoreLabel;
        },

        // Load initial data
        loadInitialData: function() {
            this.showLoadingState();
            this.loadLeaderboardData(true);
        },

        // Load leaderboard data from API
        loadLeaderboardData: async function(isInitial = false) {
            if (this.isLoading) return;
            
            this.isLoading = true;

            try {
                // Use the same KV Store API as other components
                const apiEndpoint = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
                const leaderboardKey = 'museumcheck-leaderboard';
                const url = `${apiEndpoint}?key=${encodeURIComponent(leaderboardKey)}&sortKey=*`;
                
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    this.handleDataResponse(data, isInitial);
                } else {
                    throw new Error('API response not ok');
                }
            } catch (error) {
                console.error('[LeaderboardPage] Error loading leaderboard:', error);
                // Fallback to sample data
                this.loadSampleData(isInitial);
            } finally {
                this.isLoading = false;
            }
        },

        // Handle successful data response
        handleDataResponse: function(data, isInitial) {
            // Handle both API response formats: { items: [...] } or { value: "[...]" }
            let items = [];
            if (data && data.items && Array.isArray(data.items)) {
                items = data.items;
            } else if (data && data.value && typeof data.value === 'string') {
                try {
                    items = JSON.parse(data.value);
                } catch (e) {
                    console.error('[LeaderboardPage] Failed to parse value field:', e);
                    this.showEmptyState();
                    return;
                }
            }

            if (!items || items.length === 0) {
                this.showEmptyState();
                return;
            }

            // Parse user records from KV items (include all records, not just user- prefix)
            const userRecords = items.map(item => {
                try {
                    const value = JSON.parse(item.value);
                    const sortKey = item.sortKey || item.sk || '';

                    // Extract userId from sortKey, handle both patterns:
                    // "user-xxxxxxxx" and "user-highscore-xxxxxxxx"
                    let userId = sortKey;
                    if (sortKey.startsWith('user-')) {
                        userId = sortKey.replace('user-', '');
                    }

                    // petAge = number of museums visited (打卡博物馆数即宠物年龄)
                    const petAge = value.visitedCount || 0;
                    const petStats = value.petStats || null;

                    return {
                        userId: userId,
                        nickname: value.nickname || value.userName || 'Anonymous',
                        visitedCount: value.visitedCount || 0,
                        petAge: petAge,
                        petEmoji: (petStats && petStats.petEmoji) || '🐾',
                        petName: (petStats && petStats.petName) || '小宠物',
                        rank: 0 // Will be calculated after sorting
                    };
                } catch (e) {
                    console.warn('[LeaderboardPage] Failed to parse item value:', e);
                    return null;
                }
            }).filter(item => item !== null);

            // Sort descending by the ranking metric
            userRecords.sort((a, b) => b.petAge - a.petAge);

            userRecords.forEach((record, index) => {
                record.rank = index + 1;
            });

            if (userRecords.length === 0) {
                // Genuinely no records at all
                this.showEmptyState();
                return;
            }

            userRecords.forEach((record, index) => {
                record.rank = index + 1;
            });

            if (isInitial) {
                this.allData = userRecords;
                this.renderLeaderboard(userRecords);
                this.updateUserStats(this.getCurrentUserStats(userRecords));
                this.updateLastRefreshTime();
            } else {
                this.allData = [...this.allData, ...userRecords];
                this.appendLeaderboardItems(userRecords);
            }

            this.hasMoreData = userRecords.length >= 10;
            this.updateLoadMoreButton();
            this.hideLoadingState();
        },

        // Get current user stats from the data
        getCurrentUserStats: function(records) {
            // script.js LeaderboardManager stores the id as 'user_id'
            const currentUserId = localStorage.getItem('user_id')
                || localStorage.getItem('userName')
                || 'user';
            const userRecord = records.find(record => record.userId === currentUserId);

            if (userRecord) {
                return {
                    rank: userRecord.rank,
                    visitedCount: userRecord.visitedCount,
                    petAge: userRecord.petAge
                };
            }

            return null;
        },

        // Load sample data for demo/fallback
        loadSampleData: function(isInitial) {
            const makeSampleItem = (idx, nickname, visitedCount, petEmoji, petName) => ({
                sortKey: `user-sample-${idx}`,
                value: JSON.stringify({ nickname, visitedCount, petStats: { petEmoji, petName } })
            });
            const sampleData = {
                items: [
                    makeSampleItem(1, '小淘气', 5, '🐱', '小花猫'),
                    makeSampleItem(2, '咚咚', 4, '🐶', '旺旺'),
                    makeSampleItem(3, '用户123', 3, '🐰', '跳跳'),
                    makeSampleItem(4, '小明', 2, '🐹', '团子'),
                    makeSampleItem(5, '小红', 1, '🐾', '小宠物'),
                    makeSampleItem(6, '博物馆达人', 1, '🐾', '小宠物'),
                    makeSampleItem(7, '探险家', 1, '🐾', '小宠物'),
                    makeSampleItem(8, '小考古学家', 1, '🐾', '小宠物')
                ]
            };

            this.handleDataResponse(sampleData, isInitial);
        },

        // Render leaderboard list
        renderLeaderboard: function(items) {
            const leaderboardList = document.getElementById('leaderboardList');
            if (!leaderboardList) return;

            let html = '';
            items.forEach((item, index) => {
                html += this.createLeaderboardItemHTML(item, index);
            });

            leaderboardList.innerHTML = html;
            this.animateItemsIn();
        },

        // Append new items to existing list
        appendLeaderboardItems: function(items) {
            const leaderboardList = document.getElementById('leaderboardList');
            if (!leaderboardList) return;

            const startIndex = this.allData.length - items.length;
            let html = '';
            items.forEach((item, index) => {
                html += this.createLeaderboardItemHTML(item, startIndex + index);
            });

            leaderboardList.insertAdjacentHTML('beforeend', html);
            this.animateNewItemsIn(items.length);
        },

        // Create HTML for a single leaderboard item
        createLeaderboardItemHTML: function(item, index) {
            const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}`;
            const nickname = item.nickname || '匿名用户';

            let scoreText;
            if (this.currentTab === 'museum') {
                scoreText = `🏛️ 已打卡 ${item.visitedCount || 0} 家博物馆`;
            } else {
                const petEmoji = item.petEmoji || '🐾';
                const petName = item.petName || '小宠物';
                scoreText = `${petEmoji} ${petName} · ${item.petAge || 0}岁`;
            }

            const isCurrentUser = item.nickname === '我' || item.isCurrentUser;
            const currentClass = isCurrentUser ? 'current-user' : '';

            return `
                <div class="leaderboard-item ${currentClass}" data-rank="${item.rank}" style="animation: slideInUp 0.3s ease-out ${index * 0.05}s both">
                    <div class="rank-medal">${medal}</div>
                    <div class="rank-info">
                        <div class="rank-name">${nickname}</div>
                        <div class="rank-count">${scoreText}</div>
                    </div>
                    ${isCurrentUser ? '<div class="current-badge">我</div>' : ''}
                </div>
            `;
        },

        // Update user statistics
        updateUserStats: function(userStats) {
            const myRank = document.getElementById('myRank');
            const myScore = document.getElementById('myScore');

            if (userStats) {
                if (myRank) myRank.textContent = `第 ${userStats.rank} 名`;
                if (myScore) {
                    if (this.currentTab === 'museum') {
                        myScore.textContent = `${userStats.visitedCount || 0} 家`;
                    } else {
                        myScore.textContent = `${userStats.petAge || 0}岁`;
                    }
                }
            } else {
                if (myRank) myRank.textContent = '未上榜';
                if (myScore) myScore.textContent = '-';
            }
        },

        // Update last refresh time
        updateLastRefreshTime: function() {
            const lastUpdate = document.getElementById('lastUpdate');
            if (lastUpdate) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                lastUpdate.textContent = `更新于 ${timeStr}`;
            }
        },

        // Load more data (pagination)
        loadMoreData: function() {
            if (this.isLoading || !this.hasMoreData) return;
            
            this.currentPage++;
            this.loadLeaderboardData(false);
        },

        // Update load more button visibility
        updateLoadMoreButton: function() {
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = this.hasMoreData ? 'block' : 'none';
            }
        },

        // Refresh leaderboard
        refreshLeaderboard: function() {
            const refreshBtn = document.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.classList.add('spinning');
            }

            this.currentPage = 1;
            this.allData = [];
            this.hasMoreData = true;
            this.loadInitialData();

            setTimeout(() => {
                if (refreshBtn) {
                    refreshBtn.classList.remove('spinning');
                }
            }, 1000);
        },

        // Refresh data when page becomes visible
        refreshData: function() {
            if (!this.isLoading) {
                this.refreshLeaderboard();
            }
        },

        // Show loading state
        showLoadingState: function() {
            const loadingState = document.getElementById('loadingState');
            const leaderboardList = document.getElementById('leaderboardList');
            const emptyState = document.getElementById('emptyState');

            if (loadingState) loadingState.style.display = 'block';
            if (leaderboardList) leaderboardList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'none';
        },

        // Hide loading state
        hideLoadingState: function() {
            const loadingState = document.getElementById('loadingState');
            const leaderboardList = document.getElementById('leaderboardList');

            if (loadingState) loadingState.style.display = 'none';
            if (leaderboardList) leaderboardList.style.display = 'block';
        },

        // Show empty state
        showEmptyState: function() {
            const loadingState = document.getElementById('loadingState');
            const leaderboardList = document.getElementById('leaderboardList');
            const emptyState = document.getElementById('emptyState');

            if (loadingState) loadingState.style.display = 'none';
            if (leaderboardList) leaderboardList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';

            // Nobody is on the board, so the current user cannot be ranked either
            this.updateUserStats(null);
            this.updateLastRefreshTime();
        },

        // Animate items when they appear
        animateItemsIn: function() {
            const items = document.querySelectorAll('.leaderboard-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('visible');
                }, index * 50);
            });
        },

        // Animate new items
        animateNewItemsIn: function(count) {
            const items = document.querySelectorAll('.leaderboard-item');
            const startIndex = items.length - count;
            
            for (let i = startIndex; i < items.length; i++) {
                setTimeout(() => {
                    items[i].classList.add('visible');
                }, (i - startIndex) * 50);
            }
        },

        // Initialize pull-to-refresh
        initializePullToRefresh: function() {
            let startY = 0;
            let isPulling = false;

            document.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    startY = e.touches[0].clientY;
                    isPulling = true;
                }
            });

            document.addEventListener('touchmove', (e) => {
                if (!isPulling) return;

                const currentY = e.touches[0].clientY;
                const diff = currentY - startY;

                if (diff > 80 && !this.isLoading) {
                    this.refreshLeaderboard();
                    isPulling = false;
                }
            });

            document.addEventListener('touchend', () => {
                isPulling = false;
            });
        },

        // Go back to previous page
        goBack: function() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // Fallback to home page
                window.location.href = 'index.html';
            }
        }
    };

    // Global functions for inline event handlers
    window.switchTab = (type) => LeaderboardPage.switchTab(type);
    window.refreshLeaderboard = () => LeaderboardPage.refreshLeaderboard();
    window.loadMoreData = () => LeaderboardPage.loadMoreData();
    window.goBack = () => LeaderboardPage.goBack();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            LeaderboardPage.init();
        });
    } else {
        LeaderboardPage.init();
    }

})();
