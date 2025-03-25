import OpenAI from 'openai';

export type ResearchSuggestions = {
  name: string;
  subreddits: string[];
  keywords: string[];
};

export class ResearchSuggestionsService {
  private static instance: ResearchSuggestionsService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  public static getInstance(): ResearchSuggestionsService {
    if (!ResearchSuggestionsService.instance) {
      ResearchSuggestionsService.instance = new ResearchSuggestionsService();
    }
    return ResearchSuggestionsService.instance;
  }

  public async getSuggestions(description: string): Promise<ResearchSuggestions> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes research requests and suggests relevant subreddits and keywords. Respond with a JSON object containing a name, subreddits array, and keywords array."
          },
          {
            role: "user",
            content: `Based on this research request: "${description}", suggest a concise name, relevant subreddits, and keywords. Format your response as a JSON object with this structure: {"name": "string", "subreddits": ["string"], "keywords": ["string"]}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Clean the response to ensure it's valid JSON
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleanResponse);

      // Validate the response structure
      if (!suggestions.name || !Array.isArray(suggestions.subreddits) || !Array.isArray(suggestions.keywords)) {
        throw new Error("Invalid response structure from OpenAI");
      }

      return suggestions;
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      // Return default suggestions if there's an error
      return {
        name: "Research Request",
        subreddits: [],
        keywords: []
      };
    }
  }
} 