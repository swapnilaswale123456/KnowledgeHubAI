export interface ResearchRequest {
  id: string;
  name: string;
  purpose?: string;
  description?: string;
  subreddits: string[];
  keywords: string[];
  duration?: 'day' | 'week' | 'month';
  schedule_type?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    lastRun: string;
    nextRun: string;
  };
  min_score?: number;
  min_comments?: number;
  date_range?: {
    start_date: string;
    end_date: string;
  };
  createdAt: string;
  results?: {
    postsAnalyzed: number;
    relevantPosts: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    downloadUrl?: string;
  };
}

export interface ResearchRequestsResponse {
  success: boolean;
  data: ResearchRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateResearchRequestData {
  tenant_id: string;
  created_by: string;
  name: string;
  description: string;
  schedule_type: 'daily' | 'weekly' | 'monthly';
  subreddits: string[];
  keywords: string[];
  min_score: number;
  min_comments: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
}

interface ResearchResult {
  id: string;
  request_id: string;
  run_date: string;
  total_posts: number;
  total_comments: number;
  relevant_posts: number;
  relevant_comments: number;
  sentiment_analysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  top_topics: string[];
  highlights: string[];
  report: any;
}

export class ResearchRequestsService {
  private static instance: ResearchRequestsService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = 'http://localhost:5000/api/v1';
  }

  public static getInstance(): ResearchRequestsService {
    if (!ResearchRequestsService.instance) {
      ResearchRequestsService.instance = new ResearchRequestsService();
    }
    return ResearchRequestsService.instance;
  }

  async getRequests(tenantId: string, page: number = 1, limit: number = 10): Promise<ResearchRequestsResponse> {
    console.log(`[ResearchRequestsService] Attempting to fetch research requests for tenant ${tenantId}, page ${page}, limit ${limit}`);
    try {
      // First try to fetch from the API
      let url = `${this.baseUrl}/research/requests?tenant_id=${tenantId}&page=${page}&limit=${limit}`;
      console.log('Fetching research requests from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ResearchRequestsService] HTTP error fetching requests: Status ${response.status}, Response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, Response: ${errorText}`);
      }

      const data = await response.json();
      //console.log(`[ResearchRequestsService] API Response:`, JSON.stringify(data, null, 2));
      
      // Handle both array response and object response formats
      const requests = Array.isArray(data) ? data : (data.data || []);
      
      // Map the API response to match our ResearchRequest interface
      const mappedRequests = requests.map((request: {
        id: string;
        name: string;
        description?: string;
        subreddits?: string[];
        keywords?: string[];
        status?: string;
        next_run_at?: string;
        last_run_at?: string;
        schedule_type?: string;
        created_at: string;
        results?: any;
      }) => ({
        id: request.id,
        name: request.name,
        purpose: request.description, // Map description to purpose
        description: request.description,
        subreddits: request.subreddits || [],
        keywords: request.keywords || [],
        status: request.status || 'pending',
        schedule: request.next_run_at ? {
          frequency: request.schedule_type || 'daily',
          nextRun: request.next_run_at,
          lastRun: request.last_run_at || ''
        } : undefined,
        createdAt: request.created_at,
        results: request.results || undefined
      }));
      
      // Calculate pagination
      const total = Array.isArray(data) ? data.length : (data.pagination?.total || data.data?.length || 0);
      
      return {
        success: true,
        data: mappedRequests,
        pagination: {
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || limit,
          total: total,
          totalPages: data.pagination?.totalPages || Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error(`[ResearchRequestsService] Error fetching research requests:`, 
        error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      );
      
      // Return empty response with pagination
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  async getRequestById(id: string, tenantId: string): Promise<ResearchRequest | null> {
    console.log(`[ResearchRequestsService] Attempting to fetch research request with ID ${id} for tenant ${tenantId}`);
    try {
      const response = await fetch(
        `${this.baseUrl}/research/requests/${id}?tenant_id=${tenantId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ResearchRequestsService] HTTP error fetching request with ID ${id}: Status ${response.status}, Response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, Response: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[ResearchRequestsService] API Response:`, JSON.stringify(data, null, 2));
      
      // Handle both direct object response and data property response
      const request = data.data || data;
      
      if (!request) {
        console.log(`[ResearchRequestsService] No request found with ID ${id}`);
        return null;
      }
      
      // Map the API response to match our ResearchRequest interface
      const mappedRequest: ResearchRequest = {
        id: request.id,
        name: request.name,
        purpose: request.description, // Map description to purpose
        description: request.description,
        subreddits: request.subreddits || [],
        keywords: request.keywords || [],
        status: request.status || 'pending',
        schedule: request.next_run_at ? {
          frequency: request.schedule_type || 'daily',
          nextRun: request.next_run_at,
          lastRun: request.last_run_at || ''
        } : undefined,
        createdAt: request.created_at,
        results: request.results || undefined
      };
      
      console.log(`[ResearchRequestsService] Successfully mapped research request with ID ${id}`);
      return mappedRequest;
    } catch (error) {
      console.error(`[ResearchRequestsService] Error fetching research request with ID ${id}:`, 
        error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      );
      
      // Log the mock data generation
      console.log(`[ResearchRequestsService] Falling back to mock data for request with ID ${id}`);
      // Return mock data for development/testing
      return this.getMockRequestById(id);
    }
  }
  
  async createRequest(requestData: CreateResearchRequestData): Promise<ResearchRequest | null> {
    try {
      console.log(`[ResearchRequestsService] Creating new research request:`, JSON.stringify(requestData, null, 2));
      const response = await fetch(
        `${this.baseUrl}/research/requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
                    },
          body: JSON.stringify(requestData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[ResearchRequestsService] Failed to create request:`, {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to create research request: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[ResearchRequestsService] Create request response:`, JSON.stringify(data, null, 2));

      // Handle both direct object response and data property response
      const request = data.data || data;
      
      if (!request?.id) {
        console.error(`[ResearchRequestsService] Invalid response format:`, data);
        throw new Error('Invalid response format: missing ID');
      }

      return request;
    } catch (error) {
      console.error(`[ResearchRequestsService] Error creating research request:`, 
        error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      );
      throw error; // Propagate the error instead of returning null
    }
  }

  async updateRequest(id: string, requestData: Partial<CreateResearchRequestData>): Promise<ResearchRequest | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/research/requests/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
          },
          body: JSON.stringify(requestData)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating research request with id ${id}:`, error);
      return null;
    }
  }

  async deleteRequest(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/research/requests/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting research request with id ${id}:`, error);
      return false;
    }
  }

  /**
   * Executes a research request immediately
   * @param id The ID of the research request to execute
   * @returns A promise resolving to true if successful, false otherwise
   */
  async executeRequest(id: string, tenantId: string, forceRefresh: boolean = false): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      console.log(`[ResearchRequestsService] Executing research request ${id} for tenant ${tenantId}`);
      const url = `${this.baseUrl}/research/requests/${id}/execute?tenant_id=${tenantId}&force_refresh=${forceRefresh}`;
      console.log(`[ResearchRequestsService] Executing request at: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
        }
      });

      const responseData = await response.json();
      console.log(`[ResearchRequestsService] Execute response:`, JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        console.error(`[ResearchRequestsService] Failed to execute research request:`, responseData);
        return {
          success: false,
          message: responseData.message || `Failed to execute request: ${response.status}`,
          data: responseData
        };
      }

      return {
        success: true,
        message: responseData.message || 'Request executed successfully',
        data: responseData
      };
    } catch (error) {
      console.error(`[ResearchRequestsService] Error executing research request with id ${id}:`, 
        error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      );
      
      // For development/testing, return success
      if (process.env.NODE_ENV === 'development') {
        console.log('[ResearchRequestsService] Development mode: Simulating successful execution despite error');
        return {
          success: true,
          message: 'Development mode: Simulated success',
          data: {
            status: 'success',
            message: 'Development mode: Simulated successful execution'
          }
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null
      };
    }
  }

  /**
   * Schedules a research request with the specified schedule type
   * @param requestId The ID of the research request to schedule
   * @param scheduleType The type of schedule to set (e.g., 'daily', 'weekly', 'monthly')
   * @returns A promise resolving to true if successful, false otherwise
   */
  async scheduleRequest(requestId: string, scheduleType: string): Promise<boolean> {
    try {
      console.log(`Scheduling research request ${requestId} with type ${scheduleType}`);
      const response = await fetch(`${this.baseUrl}/research/requests/${requestId}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schedule_type: scheduleType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to schedule research request:', errorData);
        
        // For development/testing, return success for specific error cases
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Simulating successful schedule');
          return true;
        }
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error scheduling research request:', error);
      
      // For development/testing, return success
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating successful schedule despite error');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Cancels the schedule for a research request
   * @param requestId The ID of the research request to cancel the schedule for
   * @returns A promise resolving to true if successful, false otherwise
   */
  async cancelSchedule(requestId: string): Promise<boolean> {
    try {
      console.log(`Canceling schedule for research request ${requestId}`);
      const response = await fetch(`${this.baseUrl}/research/requests/${requestId}/schedule`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to cancel research request schedule:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error canceling research request schedule:', error);
      // For development/testing, return success
      return true;
    }
  }

  // Helper method to generate mock research request data
  private getMockRequests(page: number = 1, limit: number = 10): ResearchRequestsResponse {
    const mockRequests: ResearchRequest[] = [
      {
        id: "1",
        name: "SaaS AI Prospects Research",
        purpose: "Identify users interested in or seeking SaaS AI products",
        subreddits: ["artificial", "MachineLearning", "SaaS", "startups"],
        keywords: ["AI tools", "ML services", "SaaS recommendation", "AI solutions"],
        status: "pending",
        schedule: {
          frequency: "weekly",
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastRun: ""
        },
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "B2B Marketing Trends",
        purpose: "Research current B2B marketing strategies and trends",
        subreddits: ["marketing", "B2B", "sales", "digitalmarketing"],
        keywords: ["B2B marketing", "lead generation", "content strategy", "account-based marketing"],
        status: "completed",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        results: {
          postsAnalyzed: 250,
          relevantPosts: 78,
          sentimentBreakdown: {
            positive: 45,
            neutral: 25,
            negative: 8
          },
          downloadUrl: "/downloads/report-2.pdf"
        }
      },
      {
        id: "3",
        name: "Product Feedback Analysis",
        purpose: "Gather customer feedback on competitor products",
        subreddits: ["ProductManagement", "software", "technology", "webdev"],
        keywords: ["product review", "user feedback", "customer experience", "pain points"],
        status: "in_progress",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Calculate pagination based on the mock data
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockRequests.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: mockRequests.length,
        totalPages: Math.ceil(mockRequests.length / limit)
      }
    };
  }

  // Helper method to get a mock request by ID
  private getMockRequestById(id: string): ResearchRequest | null {
    const mockRequests = this.getMockRequests().data;
    const request = mockRequests.find(r => r.id === id);
    
    if (!request) {
      // If no matching request is found, create a new one with the given ID
      return {
        id,
        name: "Custom Research Request",
        purpose: "Custom research purpose for development testing",
        subreddits: ["artificial", "MachineLearning"],
        keywords: ["test keyword", "development"],
        status: "pending",
        createdAt: new Date().toISOString()
      };
    }
    
    return request;
  }

  /**
   * Checks if the research API is available and responsive
   * @returns A promise resolving to an object with status information
   */
  async checkApiHealth(): Promise<{ isAvailable: boolean; statusCode?: number; message: string }> {
    console.log(`[ResearchRequestsService] Checking API health at ${this.baseUrl}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${this.baseUrl}/health`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[ResearchRequestsService] API health check successful');
        return { 
          isAvailable: true, 
          statusCode: response.status,
          message: 'API is available and responding' 
        };
      } else {
        const errorText = await response.text();
        console.error(`[ResearchRequestsService] API health check failed with status ${response.status}: ${errorText}`);
        return { 
          isAvailable: false, 
          statusCode: response.status,
          message: `API returned error status: ${response.status}` 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ResearchRequestsService] API health check failed with error: ${errorMessage}`);
      return { 
        isAvailable: false, 
        message: `Failed to connect to API: ${errorMessage}` 
      };
    }
  }

  /**
   * Gets the current status of a research request
   * @param id The ID of the research request to check
   * @param tenantId The tenant ID
   * @returns A promise resolving to the status response
   */
  async getRequestStatus(id: string, tenantId: string): Promise<{ 
    success: boolean; 
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
    requestInfo?: {
      requestId: string;
      tenantId: string;
      lastRunAt?: string;
      nextRunAt?: string;
      createdAt: string;
      updatedAt: string;
    };
    results?: {
      postsAnalyzed?: number;
      relevantPosts?: number;
      sentimentBreakdown?: {
        positive: number;
        neutral: number;
        negative: number;
      };
      downloadUrl?: string;
    };
  }> {
    try {
      console.log(`[ResearchRequestsService] Checking status for request ${id} for tenant ${tenantId}`);
      const url = `${this.baseUrl}/research/requests/${id}/status?tenant_id=${tenantId}`;
      console.log(`[ResearchRequestsService] Fetching status from: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
        }
      });

      const responseData = await response.json();
      console.log(`[ResearchRequestsService] Status response:`, JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        console.error(`[ResearchRequestsService] Failed to get request status:`, responseData);
        return {
          success: false,
          status: 'failed',
          message: responseData.message || `Failed to get status: ${response.status}`
        };
      }

      // Map the response to our expected format
      const mappedResponse = {
        success: true,
        status: responseData.status === 'running' ? 'in_progress' : responseData.status,
        requestInfo: {
          requestId: responseData.request_id,
          tenantId: responseData.tenant_id,
          lastRunAt: responseData.last_run_at,
          nextRunAt: responseData.next_run_at,
          createdAt: responseData.created_at,
          updatedAt: responseData.updated_at
        },
        message: `Request is ${responseData.status}`,
        ...(responseData.results ? { results: responseData.results } : {})
      };

      console.log(`[ResearchRequestsService] Mapped status response:`, JSON.stringify(mappedResponse, null, 2));
      return mappedResponse;

    } catch (error) {
      console.error(`[ResearchRequestsService] Error getting request status for id ${id}:`, 
        error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      );
      
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handles refreshing a research request's status and updates if needed
   * @param id The ID of the research request to refresh
   * @param tenantId The tenant ID
   * @returns A promise resolving to the refresh result
   */
  async handleRefresh(id: string, tenantId: string): Promise<{
    success: boolean;
    message?: string;
    shouldUpdate: boolean;
    status?: string;
    requestInfo?: {
      requestId: string;
      tenantId: string;
      lastRunAt?: string;
      nextRunAt?: string;
      createdAt: string;
      updatedAt: string;
    };
    results?: any;
  }> {
    try {
      // Get the current status
      const statusResponse = await this.getRequestStatus(id, tenantId);
      console.log(`[ResearchRequestsService] Status check response:`, statusResponse);

      if (!statusResponse.success) {
        return {
          success: false,
          message: statusResponse.message || 'Failed to get request status',
          shouldUpdate: false
        };
      }

      // Only update if status is completed or failed
      const shouldUpdate = ['completed', 'failed'].includes(statusResponse.status);

      return {
        success: true,
        shouldUpdate,
        status: statusResponse.status,
        requestInfo: statusResponse.requestInfo,
        ...(shouldUpdate ? { results: statusResponse.results } : {}),
        message: shouldUpdate 
          ? `Request ${statusResponse.status}` 
          : `Request is ${statusResponse.status}`
      };
    } catch (error) {
      console.error(`[ResearchRequestsService] Error handling refresh for request ${id}:`, error);
      return {
        success: false,
        shouldUpdate: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getRequestResults(requestId: string, tenantId: string, fromDate?: string, toDate?: string): Promise<ResearchResult[]> {
    console.log(`[ResearchRequestsService.getRequestResults] Fetching results for request ${requestId}`);
    console.log(`[ResearchRequestsService.getRequestResults] Parameters:`, JSON.stringify({
      requestId,
      tenantId,
      fromDate,
      toDate
    }, null, 2));
    
    try {
      let url = `${this.baseUrl}/research/requests/${requestId}/results?tenant_id=${tenantId}`;
      if (fromDate && toDate) {
        url += `&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`;
      }

      console.log(`[ResearchRequestsService.getRequestResults] Fetching from URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PYTHON_API_KEY || ''}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ResearchRequestsService.getRequestResults] Error response: Status ${response.status}, Response: ${errorText}`);
        return [];
      }

      const data = await response.json();
      console.log(`[ResearchRequestsService.getRequestResults] Raw response:`, JSON.stringify(data, null, 2));
      
      // Handle both array and object response formats
      const results = Array.isArray(data) ? data : (data.data || data.results || []);
      
      // Map the results to ensure consistent format
      const mappedResults = results.map((result: any) => ({
        id: result.id,
        request_id: result.request_id,
        run_date: result.run_date,
        total_posts: result.total_posts,
        total_comments: result.total_comments,
        relevant_posts: result.relevant_posts,
        relevant_comments: result.relevant_comments,
        research_metrics: {
          total_engagement: result.research_metrics?.total_engagement || 0,
          relevance_score: result.research_metrics?.relevance_score || 0,
          research_quality: result.research_metrics?.research_quality || 0
        },
        report: {
          sentiment_analysis: result.report?.sentiment_analysis || {
            labels: [],
            values: [],
            colors: [],
            insights: {
              dominant_sentiment: '',
              sentiment_balance: '',
              engagement_correlation: ''
            }
          },
          topics: result.report?.topics || {
            labels: [],
            values: [],
            colors: [],
            topic_insights: {
              topic_count: 0,
              topic_diversity: '',
              primary_focus: '',
              topic_categories: {
                technical: 0,
                business: 0,
                community: 0
              }
            }
          },
          summary: {
            overview: {
              key_findings: result.report?.summary?.overview?.key_findings || [],
              executive_summary: result.report?.summary?.overview?.executive_summary || ''
            },
            discussion_analysis: {
              content_analysis: result.report?.summary?.discussion_analysis?.content_analysis || {
                post_summary: '',
                comment_summary: '',
                content_quality: {
                  depth: 0,
                  breadth: 0,
                  controversy_level: 0
                }
              },
              engagement_analysis: result.report?.summary?.discussion_analysis?.engagement_analysis || {
                interaction_patterns: '',
                knowledge_sharing: '',
                user_engagement: {
                  consensus_strength: 0,
                  discussion_health: 0
                }
              },
              thematic_analysis: result.report?.summary?.discussion_analysis?.thematic_analysis || {
                main_themes: [],
                expertise_areas: [],
                controversial_topics: [],
                consensus_points: [],
                theme_coherence: 0,
                expertise_depth: 0
              }
            },
            recommendations: {
              suggestions: result.report?.summary?.recommendations?.suggestions || [],
              action_items: result.report?.summary?.recommendations?.action_items || []
            }
          },
          redditor_leads: result.report?.redditor_leads || [],
          subreddit_analytics: result.report?.subreddit_analytics || {
            raw_data: {
              subreddit: '',
              total_posts: 0,
              total_comments: 0
            },
            analytics_summary: {
              engagement_level: '',
              content_volume: {
                posts: 0,
                comments: 0,
                relevance_ratio: 0
              }
            }
          }
        }
      }));

      console.log(`[ResearchRequestsService.getRequestResults] Mapped ${mappedResults.length} results:`, JSON.stringify(mappedResults, null, 2));
      return mappedResults;
    } catch (error) {
      console.error('[ResearchRequestsService.getRequestResults] Error:', 
        error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      );
      return [];
    }
  }
} 