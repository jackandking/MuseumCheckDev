#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const KV_STORE_ENDPOINT = process.env.KV_STORE_ENDPOINT;

// 创建 MCP Server
const server = new Server(
  {
    name: 'museum-kvstore-server',
    version: '1.0.0',
  },
  {
    capabilities:  {
      tools: {},
    },
  }
);

// 定义可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_museum_data',
        description: '从 KV Store 获取博物馆数据',
        inputSchema: {
          type: 'object',
          properties: {
            museumId: {
              type:  'string',
              description:  '博物馆 ID，例如：beijing-capital-museum',
            },
            sortKey: {
              type:  'string',
              description:  '排序键，默认为 "museum"',
              default: 'museum',
            },
          },
          required:  ['museumId'],
        },
      },
      {
        name:  'get_survey_data',
        description: '获取调查问卷数据（投票统计）',
        inputSchema:  {
          type: 'object',
          properties: {
            surveyType: {
              type: 'string',
              enum: ['museumPopularity.data', 'capitalMuseumTreasure.data', 'museumCount.data'],
              description: '调查类型：博物馆人气调查、镇馆之宝猜测、博物馆数量猜测',
            },
          },
          required: ['surveyType'],
        },
      },
      {
        name: 'update_survey_vote',
        description: '更新调查问卷投票数据',
        inputSchema: {
          type: 'object',
          properties: {
            surveyType: {
              type: 'string',
              description: 'Storage Key，例如：museumPopularity.data',
            },
            itemKey: {
              type: 'string',
              description: '投票项目的键（博物馆ID或选项名称）',
            },
            increment: {
              type: 'number',
              description: '增加的票数，默认为 1',
              default: 1,
            },
          },
          required: ['surveyType', 'itemKey'],
        },
      },
      {
        name: 'search_official_museums',
        description: '搜索中国官方博物馆数据库，获取真实的博物馆信息（藏品数量、参观人数、质量等级等）',
        inputSchema: {
          type: 'object',
          properties: {
            museumName: {
              type: 'string',
              description: '博物馆名称或关键词，例如：故宫、国家博物馆、上海博物馆',
            },
          },
          required: ['museumName'],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_museum_data':  {
        const { museumId, sortKey = 'museum' } = args;
        const key = `museum-data-${museumId}`;
        
        const response = await fetch(
          `${KV_STORE_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`
        );
        
        const data = await response.json();
        const museumData = data.value ? JSON.parse(data.value) : null;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(museumData, null, 2),
            },
          ],
        };
      }

      case 'get_survey_data': {
        const { surveyType } = args;
        
        const response = await fetch(
          `${KV_STORE_ENDPOINT}?key=${encodeURIComponent(surveyType)}&sortKey=None`
        );
        
        const data = await response.json();
        const surveyData = data.value ? JSON.parse(data.value) : {};
        
        // 计算统计信息
        const totalVotes = Object.values(surveyData).reduce((a, b) => a + b, 0);
        const statistics = Object.entries(surveyData)
          .map(([item, votes]) => ({
            item,
            votes,
            percentage: totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(2) + '%' : '0%',
          }))
          .sort((a, b) => b.votes - a.votes);
        
        return {
          content:  [
            {
              type:  'text',
              text:  JSON.stringify({ totalVotes, statistics }, null, 2),
            },
          ],
        };
      }

      case 'update_survey_vote': {
        const { surveyType, itemKey, increment = 1 } = args;
        
        // 先读取现有数据
        const readResponse = await fetch(
          `${KV_STORE_ENDPOINT}?key=${encodeURIComponent(surveyType)}&sortKey=None`
        );
        const readData = await readResponse.json();
        const currentData = readData.value ? JSON.parse(readData.value) : {};
        
        // 更新投票数
        currentData[itemKey] = (currentData[itemKey] || 0) + increment;
        
        // 写回 KV Store
        const writeResponse = await fetch(KV_STORE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: surveyType,
            sortKey: 'None',
            value: JSON.stringify(currentData),
            expireAt: 4866674732, // 2124年
          }),
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated vote for ${itemKey}.  New count: ${currentData[itemKey]}`,
            },
          ],
        };
      }

      case 'search_official_museums': {
        const { museumName } = args;
        
        // 调用 letmetry.cloud 的博物馆搜索 API
        const response = await fetch('https://letmetry.cloud/museum/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ museumName }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Museum search failed');
        }
        
        // 格式化返回结果，提供更友好的展示
        const formattedResults = {
          searchTerm: data.museumName,
          totalResults: data.count,
          museums: data.museums.map(museum => ({
            名称: museum.name,
            省份: museum.province,
            性质: museum.nature,
            质量等级: museum.qualityGrade,
            免费开放: museum.freeAdmission === '是' ? '是' : '否',
            藏品数量: museum.collectionCount,
            珍贵文物数量: museum.preciousArtifactsCount,
            年度展览次数: museum.exhibitionsCount,
            年度教育活动次数: museum.educationalActivitiesCount,
            年度参观人数_万人: museum.visitorCount,
          })),
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedResults, null, 2),
            },
          ],
        };
      }

      default: 
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Museum KV Store MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
