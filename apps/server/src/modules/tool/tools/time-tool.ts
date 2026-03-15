import { Tool } from '../tool.interface';
import { format, addDays, subDays, addHours, subHours, addMinutes, subMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export class TimeTool implements Tool {
  name = 'time';
  description = 'Get current time, format time, convert timezones, and perform time calculations';
  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['now', 'format', 'convert', 'add', 'subtract'],
        description: 'Action to perform',
      },
      format: {
        type: 'string',
        description: 'Date format string (e.g., "yyyy-MM-dd HH:mm:ss")',
        default: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      },
      timezone: {
        type: 'string',
        description: 'Timezone (e.g., "Asia/Shanghai", "America/New_York")',
        default: 'UTC',
      },
      date: {
        type: 'string',
        description: 'Input date string (ISO format) for format/convert actions',
      },
      unit: {
        type: 'string',
        enum: ['days', 'hours', 'minutes'],
        description: 'Time unit for add/subtract actions',
      },
      value: {
        type: 'number',
        description: 'Value to add or subtract',
      },
    },
    required: ['action'],
  } as const;

  async execute(params: Record<string, any>): Promise<any> {
    const { action, format: formatStr, timezone, date, unit, value } = params;

    const now = new Date();

    switch (action) {
      case 'now': {
        return {
          iso: now.toISOString(),
          timestamp: now.getTime(),
          formatted: format(now, formatStr || "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };
      }

      case 'format': {
        const inputDate = date ? new Date(date) : now;
        const zonedDate = toZonedTime(inputDate, timezone || 'UTC');
        return {
          formatted: format(zonedDate, formatStr || 'yyyy-MM-dd HH:mm:ss'),
          timezone: timezone || 'UTC',
        };
      }

      case 'convert': {
        if (!date) {
          throw new Error('Date is required for convert action');
        }
        const inputDate = new Date(date);
        const zonedDate = toZonedTime(inputDate, timezone || 'UTC');
        return {
          original: date,
          converted: format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          timezone: timezone || 'UTC',
        };
      }

      case 'add': {
        if (!unit || value === undefined) {
          throw new Error('unit and value are required for add action');
        }
        const inputDate = date ? new Date(date) : now;
        let result: Date;
        switch (unit) {
          case 'days':
            result = addDays(inputDate, value);
            break;
          case 'hours':
            result = addHours(inputDate, value);
            break;
          case 'minutes':
            result = addMinutes(inputDate, value);
            break;
          default:
            throw new Error(`Invalid unit: ${unit}`);
        }
        return {
          original: date || now.toISOString(),
          result: result.toISOString(),
          operation: `added ${value} ${unit}`,
        };
      }

      case 'subtract': {
        if (!unit || value === undefined) {
          throw new Error('unit and value are required for subtract action');
        }
        const inputDate = date ? new Date(date) : now;
        let result: Date;
        switch (unit) {
          case 'days':
            result = subDays(inputDate, value);
            break;
          case 'hours':
            result = subHours(inputDate, value);
            break;
          case 'minutes':
            result = subMinutes(inputDate, value);
            break;
          default:
            throw new Error(`Invalid unit: ${unit}`);
        }
        return {
          original: date || now.toISOString(),
          result: result.toISOString(),
          operation: `subtracted ${value} ${unit}`,
        };
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  }
}
