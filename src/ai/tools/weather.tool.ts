import type { ToolDefinition } from '@/ai/types';

export const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get the current weather for a city',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name (e.g. London, Tokyo)' },
      units: { type: 'string', description: 'Temperature units', enum: ['celsius', 'fahrenheit'] },
    },
    required: ['city'],
  },
  handler: async (args) => {
    const city = args.city as string;
    return JSON.stringify({
      city,
      temperature: 22,
      units: args.units || 'celsius',
      condition: 'partly cloudy',
      humidity: '65%',
    });
  },
};
