// Moltbook API Client
// Based on https://www.moltbook.com/skill.md

const MOLTBOOK_API_URL = 'https://www.moltbook.com/api/v1';

export interface MoltbookAgent {
  name: string;
  description: string;
  karma: number;
  follower_count: number;
  following_count: number;
  is_claimed: boolean;
  is_active: boolean;
  created_at: string;
  last_active: string;
  owner?: {
    x_handle?: string;
    x_name?: string;
    x_avatar?: string;
  };
}

export interface MoltbookSubmolt {
  name: string;
  display_name?: string;
  description: string;
  subscriber_count?: number;
  allow_crypto?: boolean;
  created_by?: {
    id: string;
    name: string;
  };
  moderators?: Array<{
    name: string;
    role: string;
  }>;
  your_role?: string | null;
}

export interface MoltbookPost {
  id: string;
  title?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    description?: string;
    karma: number;
    follower_count: number;
    following_count: number;
    owner?: {
      x_handle?: string;
      x_name?: string;
    };
  };
  submolt?: {
    name: string;
    display_name?: string;
  };
}

export class MoltbookClient {
  private agentApiKey: string;

  constructor(agentApiKey: string) {
    this.agentApiKey = agentApiKey;
  }

  /**
   * Fetch a post by ID from Moltbook
   * GET /posts/POST_ID
   */
  async getPost(postId: string): Promise<MoltbookPost | null> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/posts/${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.post || data.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get agent profile by name
   * GET /agents/profile?name=MOLTY_NAME
   */
  async getAgent(agentName: string): Promise<MoltbookAgent | null> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/agents/profile?name=${encodeURIComponent(agentName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.agentApiKey}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.agent;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get submolt details by name
   * GET /submolts/SUBMOLT_NAME
   */
  async getSubmolt(submoltName: string): Promise<MoltbookSubmolt | null> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/submolts/${encodeURIComponent(submoltName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.submolt || data.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if agent meets karma threshold
   */
  async checkKarmaThreshold(agentName: string, threshold: number): Promise<boolean> {
    const agent = await this.getAgent(agentName);
    if (!agent) return false;
    return agent.karma >= threshold;
  }
}

// Singleton instance
let moltbookClient: MoltbookClient | null = null;

export function getMoltbookClient(): MoltbookClient {
  if (!moltbookClient) {
    const apiKey = process.env.MOLTBOOK_AGENT_API_KEY;
    if (!apiKey) {
      throw new Error('MOLTBOOK_AGENT_API_KEY environment variable not set');
    }
    moltbookClient = new MoltbookClient(apiKey);
  }
  return moltbookClient;
}
