/**
 * Treasure Hunt Workflow Generator
 * Automatically generates "镇馆之宝探索" (Treasure Discovery) workflows for all museums
 * 
 * Issue: 推广平湖博物馆经验 - Extend v3 treasure hunt experience to all museums
 * 
 * Features:
 * - Uses existing collections data when available (with images)
 * - Generates placeholder descriptions for museums without collections
 * - Creates consistent workflow structure across all museums
 */

(function() {
  'use strict';

  /**
   * Generate treasure items for a museum
   * @param {Object} museum - Museum object from MUSEUMS array
   * @returns {Array} Array of treasure items with name, imageUrl (optional), and description
   */
  function generateTreasureItems(museum) {
    // If museum already has collections, use them
    if (museum.collections && Array.isArray(museum.collections) && museum.collections.length > 0) {
      return museum.collections.slice(0, 3); // Use first 3 treasures
    }

    // Generate placeholder treasures based on museum characteristics
    const treasures = [];
    const museumType = getMuseumType(museum);
    const location = museum.location || '本地';
    
    // Generate 3 treasure placeholders
    for (let i = 0; i < 3; i++) {
      treasures.push({
        name: generateTreasureName(museum, museumType, i),
        description: generateTreasureDescription(museum, museumType, i)
        // Note: no imageUrl - will display as text description
      });
    }
    
    return treasures;
  }

  /**
   * Determine museum type from tags and description
   */
  function getMuseumType(museum) {
    const tags = museum.tags || [];
    const desc = (museum.description || '').toLowerCase();
    const name = (museum.name || '').toLowerCase();

    // Check for specific types
    if (tags.includes('历史') || desc.includes('历史') || name.includes('历史')) return 'history';
    if (tags.includes('艺术') || desc.includes('艺术') || name.includes('美术')) return 'art';
    if (tags.includes('科技') || desc.includes('科技') || name.includes('科技')) return 'science';
    if (tags.includes('自然') || desc.includes('自然') || name.includes('自然')) return 'nature';
    if (tags.includes('民俗') || desc.includes('民俗') || name.includes('民俗')) return 'folk';
    if (tags.includes('军事') || desc.includes('军事') || name.includes('军事')) return 'military';
    if (tags.includes('地方') || desc.includes('地方')) return 'local';
    
    return 'general';
  }

  /**
   * Generate treasure name based on museum type
   */
  function generateTreasureName(museum, type, index) {
    const templates = {
      history: ['珍贵文物', '历史遗迹', '古代器物'],
      art: ['艺术珍品', '名家作品', '经典藏品'],
      science: ['科技展品', '互动装置', '科学模型'],
      nature: ['自然标本', '化石展品', '生态展示'],
      folk: ['民俗文物', '传统工艺品', '地方特色展品'],
      military: ['军事文物', '历史装备', '纪念展品'],
      local: ['地方特色文物', '乡土珍品', '历史见证'],
      general: ['馆藏珍品', '特色展品', '重要藏品']
    };

    const names = templates[type] || templates.general;
    return names[index] || `珍贵展品 ${index + 1}`;
  }

  /**
   * Generate treasure description
   */
  function generateTreasureDescription(museum, type, index) {
    const location = museum.location || '本馆';
    const name = museum.name || '本博物馆';
    
    const templates = {
      history: [
        `${location}历史文化的重要见证，展现了这片土地的悠久历史和深厚文化底蕴`,
        `承载着${location}地区的历史记忆，是了解当地历史发展的重要实物`,
        `反映${location}历史变迁的珍贵文物，具有重要的历史研究价值`
      ],
      art: [
        `${name}珍藏的艺术精品，展现了独特的艺术魅力和文化价值`,
        `具有重要艺术价值的馆藏珍品，体现了高超的艺术造诣`,
        `艺术价值突出的代表性作品，是艺术爱好者不容错过的展品`
      ],
      science: [
        `具有科普教育意义的重要展品，帮助理解科学原理和技术发展`,
        `展现科技发展历程的代表性展品，激发科学探索兴趣`,
        `互动性强的科技展品，让参观者亲身体验科学的奥秘`
      ],
      nature: [
        `珍贵的自然标本，展示大自然的奇妙和生物多样性`,
        `具有重要科研价值的自然展品，帮助了解自然演化历程`,
        `生动展现自然世界的精彩展品，激发探索自然的兴趣`
      ],
      folk: [
        `${location}民俗文化的代表性展品，传承着地方特色文化`,
        `反映${location}传统生活方式的重要实物，是民俗研究的宝贵资料`,
        `展现地方特色文化的精美工艺品，体现了民间智慧和技艺`
      ],
      military: [
        `具有重要历史意义的军事文物，铭记历史，缅怀先烈`,
        `展现军事历史的珍贵实物，是爱国主义教育的重要素材`,
        `军事文化的代表性展品，体现了不同历史时期的军事特色`
      ],
      local: [
        `${location}地方文化的重要代表，展现了地域特色和文化传统`,
        `反映${location}地方历史文化的特色展品，是了解本地文化的窗口`,
        `承载着${location}地方记忆的珍贵文物，具有独特的地方文化价值`
      ],
      general: [
        `${name}的代表性藏品，具有重要的文化和历史价值`,
        `馆藏精品之一，是了解${name}特色的重要展品`,
        `${name}重点推荐的参观展品，值得细细观赏和了解`
      ]
    };

    const descriptions = templates[type] || templates.general;
    return descriptions[index] || `${name}的特色展品，值得深入了解`;
  }

  /**
   * Generate treasure hunt workflow for a museum
   * @param {Object} museum - Museum object
   * @returns {Object} Workflow object
   */
  function generateTreasureHuntWorkflow(museum) {
    const treasures = generateTreasureItems(museum);
    const museumName = museum.name || '博物馆';
    
    // Build tasks array
    const gatePhotoTask = {
      id: 'gate-photo',
      role: 'parent',
      type: 'photo',
      title: '门口打卡',
      subtitle: `在${museumName}门口拍一张照片`,
      ages: ['3-6', '7-12', '13-18']
    };
    
    // Add museum image if available
    if (museum.image) {
      gatePhotoTask.imageUrl = museum.image;
    }
    
    const tasks = [gatePhotoTask];

    // Add treasure hunt tasks
    treasures.forEach((treasure, index) => {
      const task = {
        id: `find-treasure-${index + 1}`,
        role: 'child',
        type: 'photo',
        title: `镇馆之宝 ${index + 1}/${treasures.length}`,
        subtitle: `找到「${treasure.name}」并合影`,
        ages: ['3-6', '7-12', '13-18'],
        source: {
          from: 'treasure-hunt',
          name: treasure.name,
          index: index
        }
      };

      // Add imageUrl if available
      if (treasure.imageUrl) {
        task.imageUrl = treasure.imageUrl;
      }

      // Add description as hint if no image or for accessibility
      if (treasure.description) {
        task.hint = treasure.description;
      }

      tasks.push(task);
    });

    // Add completion tasks
    tasks.push(
      {
        id: 'victory-photo',
        role: 'parent',
        type: 'photo',
        title: '完成合影',
        subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！',
        ages: ['3-6', '7-12', '13-18']
      },
      {
        id: 'poster',
        role: 'parent',
        type: 'poster',
        title: '成就海报',
        subtitle: '生成专属成就海报',
        ages: ['3-6', '7-12', '13-18']
      }
    );

    // Return workflow object
    return {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: treasures.length > 0 && treasures[0].imageUrl
        ? `围绕${museumName}镇馆之宝的亲子探索路线`
        : `探索${museumName}的特色展品和文化珍藏`,
      ages: ['3-6', '7-12', '13-18'],
      tasks: tasks
    };
  }

  /**
   * Generate workflows for all museums
   * Adds treasure hunt workflow to museums that don't already have one
   */
  function generateWorkflowsForAllMuseums() {
    if (!window.MUSEUMS || !Array.isArray(window.MUSEUMS)) {
      console.warn('[TreasureWorkflowGenerator] MUSEUMS array not found');
      return;
    }

    let generatedCount = 0;
    let existingCount = 0;

    window.MUSEUMS.forEach(function(museum) {
      if (!museum || !museum.id) return;

      // Check if museum already has a treasure hunt workflow
      const hasWorkflow = museum.workflows && Array.isArray(museum.workflows) &&
        museum.workflows.some(wf => wf.id === 'treasure-discovery');

      if (hasWorkflow) {
        existingCount++;
        return; // Skip if already has workflow
      }

      // Generate and add workflow
      const workflow = generateTreasureHuntWorkflow(museum);
      
      // Initialize workflows array if needed
      if (!museum.workflows) {
        museum.workflows = [];
      } else if (!Array.isArray(museum.workflows)) {
        museum.workflows = [];
      }

      // Add workflow
      museum.workflows.push(workflow);
      generatedCount++;
    });

    console.log(`[TreasureWorkflowGenerator] Generated ${generatedCount} new treasure hunt workflows`);
    console.log(`[TreasureWorkflowGenerator] ${existingCount} museums already had workflows`);
    console.log(`[TreasureWorkflowGenerator] Total museums: ${window.MUSEUMS.length}`);
  }

  // Auto-generate workflows when script loads
  // Wait for MUSEUMS to be available
  if (typeof window !== 'undefined') {
    if (window.MUSEUMS) {
      // MUSEUMS already loaded, generate immediately
      generateWorkflowsForAllMuseums();
    } else {
      // Wait for MUSEUMS to load
      var checkInterval = setInterval(function() {
        if (window.MUSEUMS) {
          clearInterval(checkInterval);
          generateWorkflowsForAllMuseums();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(function() {
        clearInterval(checkInterval);
      }, 5000);
    }
  }

  // Export for testing and manual use
  if (typeof window !== 'undefined') {
    window.TreasureWorkflowGenerator = {
      generateTreasureItems: generateTreasureItems,
      generateTreasureHuntWorkflow: generateTreasureHuntWorkflow,
      generateWorkflowsForAllMuseums: generateWorkflowsForAllMuseums,
      getMuseumType: getMuseumType
    };
  }

  // Export for Node.js testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      generateTreasureItems: generateTreasureItems,
      generateTreasureHuntWorkflow: generateTreasureHuntWorkflow,
      generateWorkflowsForAllMuseums: generateWorkflowsForAllMuseums,
      getMuseumType: getMuseumType
    };
  }
})();
