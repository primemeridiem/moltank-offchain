// Moltbook API Client

const MOLTBOOK_API_URL = 'https://www.moltbook.com/api/v1';

export interface MoltbookAgent {
  id: string;
  name: string;
  karma: number;
  avatar?: string;
  claimed: boolean;
  followerCount: number;
  postCount: number;
  commentCount: number;
  owner?: {
    xHandle?: string;
  };
}

export interface MoltbookSubmolt {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  subscriberCount: number;
}

export interface VerifyIdentityResponse {
  success: boolean;
  agent?: MoltbookAgent;
  error?: string;
}

export class MoltbookClient {
  private appKey: string;

  constructor(appKey: string) {
    this.appKey = appKey;
  }

  /**
   * Verify an agent's identity token
   * Used when an agent authenticates with our service
   */
  async verifyIdentity(token: string): Promise<VerifyIdentityResponse> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/agents/verify-identity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Moltbook-App-Key': this.appKey,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get agent details by ID (public info)
   */
  async getAgent(agentId: string): Promise<MoltbookAgent | null> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get submolt details by ID
   */
  async getSubmolt(submoltId: string): Promise<MoltbookSubmolt | null> {
    try {
      const response = await fetch(`${MOLTBOOK_API_URL}/submolts/${submoltId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if agent meets karma threshold
   */
  async checkKarmaThreshold(agentId: string, threshold: number): Promise<boolean> {
    const agent = await this.getAgent(agentId);
    if (!agent) return false;
    return agent.karma >= threshold;
  }
}

// Singleton instance
let moltbookClient: MoltbookClient | null = null;

export function getMoltbookClient(): MoltbookClient {
  if (!moltbookClient) {
    const appKey = process.env.MOLTBOOK_APP_KEY;
    if (!appKey) {
      throw new Error('MOLTBOOK_APP_KEY environment variable not set');
    }
    moltbookClient = new MoltbookClient(appKey);
  }
  return moltbookClient;
}
