import { gameAgent } from './agent.js';
import { filesystemAgent } from './filesystemAgent.js';
import { routerAgent } from './routerAgent.js';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  agent: any;
}

export const agentRegistry: Record<string, AgentInfo> = {
  game: {
    id: 'game',
    name: 'Game Controller',
    description: 'ゲームのブロック移動を制御',
    agent: gameAgent,
  },
  filesystem: {
    id: 'filesystem',
    name: 'Filesystem Agent',
    description: 'ファイルシステム操作を実行',
    agent: filesystemAgent,
  },
  router: {
    id: 'router',
    name: 'Router Agent',
    description: 'メッセージを適切なエージェントにルーティング',
    agent: routerAgent,
  },
};

export function getAgent(agentId: string) {
  const agentInfo = agentRegistry[agentId];
  if (!agentInfo) {
    throw new Error(`エージェント '${agentId}' が見つかりません`);
  }
  return agentInfo.agent;
}

export function listAgents(): AgentInfo[] {
  return Object.values(agentRegistry);
}

export async function routeMessage(message: string, author?: string) {
  console.log(`\n📨 メッセージをルーティング中: "${message}"`);
  
  try {
    // ルーターエージェントにメッセージを送信
    const routerResponse = await routerAgent.generate([
      { role: 'user', content: message }
    ], {
      maxSteps: 3
    });

    // ルーティング結果を取得
    let routedAgentId: string | null = null;
    let routingReason: string | null = null;

    // response.toolCallsをチェック
    if (routerResponse.toolCalls && routerResponse.toolCalls.length > 0) {
      for (const toolCall of routerResponse.toolCalls) {
        if (toolCall.toolName === 'routeToAgent') {
          routedAgentId = toolCall.args.agentId;
          routingReason = toolCall.args.reason;
          break;
        }
      }
    }

    // response.stepsからもチェック
    if (!routedAgentId && routerResponse.steps) {
      for (const step of routerResponse.steps) {
        if (step.toolCalls && step.toolCalls.length > 0) {
          for (const toolCall of step.toolCalls) {
            if (toolCall.toolName === 'routeToAgent') {
              routedAgentId = toolCall.args.agentId;
              routingReason = toolCall.args.reason;
              break;
            }
          }
        }
        if (routedAgentId) break;
      }
    }

    if (!routedAgentId) {
      console.log('❌ ルーティング先が決定できませんでした。デフォルトでgameエージェントを使用します');
      routedAgentId = 'game';
    }

    console.log(`✅ ルーティング先: ${routedAgentId}`);
    if (routingReason) {
      console.log(`   理由: ${routingReason}`);
    }

    // 選択されたエージェントでメッセージを処理
    const targetAgent = getAgent(routedAgentId);
    const agentResponse = await targetAgent.generate([
      { role: 'user', content: message }
    ], {
      maxSteps: 5
    });

    return {
      routedTo: routedAgentId,
      reason: routingReason,
      response: agentResponse,
    };
  } catch (error) {
    console.error('❌ ルーティングエラー:', error);
    throw error;
  }
}